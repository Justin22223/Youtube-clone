import express from "express";
import multer from "multer";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";

const router = express.Router();

// ── Video Schema ──────────────────────────────────────────────────────────────
const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  videoUrl: { type: String, required: true },
  thumbnail: { type: String, default: "" },
  userId: { type: String, required: true },
  duration: { type: String, default: "00:00" },
  visibility: { type: String, enum: ["public", "unlisted", "private"], default: "public" },
  views: { type: Number, default: 0 },
  likes: [{ type: String }],
  dislikes: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

const Video = mongoose.models.Video || mongoose.model("Video", videoSchema);

// ── Multer — memory storage (we stream to GridFS manually) ────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
  fileFilter: (_req, file, cb) => {
    if (file.fieldname === "thumbnail") {
      const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      return allowed.includes(file.mimetype)
        ? cb(null, true)
        : cb(new Error("Invalid image type. Only JPEG, PNG, WebP and GIF are allowed."));
    }
    const allowed = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];
    return allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Invalid video type. Only MP4, WebM, MOV and AVI are allowed."));
  },
});

// ── GridFS helpers ────────────────────────────────────────────────────────────

/** Upload a buffer into a GridFS bucket, resolve with the inserted ObjectId */
const uploadToGridFS = (bucketName, buffer, filename, mimetype) =>
  new Promise((resolve, reject) => {
    const db = mongoose.connection.db;
    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName });
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: { mimetype },
    });
    uploadStream.on("error", reject);
    uploadStream.on("finish", () => resolve(uploadStream.id));
    uploadStream.end(buffer);
  });

/** Build the absolute stream URL for a GridFS file */
const streamUrl = (req, fileId, type) =>
  `${req.protocol}://${req.get("host")}/api/upload/stream/${fileId}?type=${type}`;

/** Extract ObjectId from a stream URL like …/stream/<id>?type=… */
const idFromUrl = (url) => {
  try {
    const u = new URL(url);
    const id = u.pathname.split("/stream/")[1];
    return id && ObjectId.isValid(id) ? new ObjectId(id) : null;
  } catch {
    return null;
  }
};

// ── ROUTES ───────────────────────────────────────────────────────────────────

/**
 * GET /api/upload/stream/:fileId?type=video|thumbnail
 * Stream a file from GridFS (supports HTTP Range for video seeking).
 */
router.get("/stream/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;
    const type = req.query.type === "thumbnail" ? "thumbnail" : "video";

    if (!ObjectId.isValid(fileId)) {
      return res.status(400).json({ error: "Invalid file ID" });
    }

    const db = mongoose.connection.db;
    const bucketName = type === "thumbnail" ? "thumbnails" : "videos";
    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName });
    const oid = new ObjectId(fileId);

    // Fetch file metadata
    const files = await bucket.find({ _id: oid }).toArray();
    if (!files.length) return res.status(404).json({ error: "File not found" });

    const file = files[0];
    const contentType =
      file.metadata?.mimetype ||
      (type === "thumbnail" ? "image/jpeg" : "video/mp4");
    const fileSize = file.length;

    const range = req.headers.range;
    if (range) {
      const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
      const start = parseInt(startStr, 10);
      const end = endStr ? parseInt(endStr, 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": contentType,
      });
      bucket.openDownloadStream(oid, { start, end: end + 1 }).pipe(res);
    } else {
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": contentType,
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000",
      });
      bucket.openDownloadStream(oid).pipe(res);
    }
  } catch (err) {
    console.error("Stream error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/upload/user/:userId
 * List all videos uploaded by a user.
 */
router.get("/user/:userId", async (req, res) => {
  try {
    const videos = await Video.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(videos.map((v) => v.toObject()));
  } catch (err) {
    console.error("Error fetching user videos:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/upload/video
 * Upload a video (+ optional auto-generated thumbnail) and save metadata to MongoDB.
 * Files are stored in MongoDB Atlas GridFS — never on disk.
 */
router.post(
  "/video",
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      console.log("📤 Upload request received");
      const { title, description, userId, visibility, duration } = req.body;
      const videoFile = req.files?.video?.[0] || null;
      const thumbnailFile = req.files?.thumbnail?.[0] || null;

      if (!videoFile) return res.status(400).json({ error: "No video file uploaded" });
      if (!title?.trim()) return res.status(400).json({ error: "Title is required" });

      // Upload video to GridFS
      const videoFileId = await uploadToGridFS(
        "videos",
        videoFile.buffer,
        `${Date.now()}-${videoFile.originalname.replace(/\s+/g, "_")}`,
        videoFile.mimetype
      );
      const videoUrl = streamUrl(req, videoFileId, "video");

      // Upload thumbnail to GridFS (if provided), else use UI-Avatars placeholder
      let thumbnail;
      if (thumbnailFile) {
        const thumbFileId = await uploadToGridFS(
          "thumbnails",
          thumbnailFile.buffer,
          `thumb-${Date.now()}.jpg`,
          thumbnailFile.mimetype
        );
        thumbnail = streamUrl(req, thumbFileId, "thumbnail");
      } else {
        thumbnail = `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=random&color=fff&size=320`;
      }

      const video = new Video({
        title: title.trim(),
        description: description || "",
        videoUrl,
        thumbnail,
        userId: userId || "1",
        duration: duration || "00:00",
        visibility: visibility || "public",
        views: 0,
        likes: [],
        dislikes: [],
      });

      await video.save();
      console.log("✅ Video saved to MongoDB:", video._id);

      res.status(201).json({ message: "Video uploaded successfully", video: video.toObject() });
    } catch (err) {
      console.error("❌ Upload error:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * GET /api/upload/video/:videoId
 * Retrieve a single video document.
 */
router.get("/video/:videoId", async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId);
    if (!video) return res.status(404).json({ error: "Video not found" });
    res.json(video.toObject());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/upload/video/:videoId
 * Delete a video and its associated GridFS files.
 */
router.delete("/video/:videoId", async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId);
    if (!video) return res.status(404).json({ error: "Video not found" });

    const db = mongoose.connection.db;

    const videoFileId = idFromUrl(video.videoUrl);
    if (videoFileId) {
      const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: "videos" });
      await bucket.delete(videoFileId).catch(() => {});
    }

    const thumbFileId = idFromUrl(video.thumbnail);
    if (thumbFileId) {
      const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: "thumbnails" });
      await bucket.delete(thumbFileId).catch(() => {});
    }

    await Video.findByIdAndDelete(req.params.videoId);
    res.json({ message: "Video deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;