import express from "express";
import multer from "multer";
import { GridFsStorage } from "multer-gridfs-storage";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";

const router = express.Router();

// Define Video Schema (inline to avoid circular import issues)
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
  createdAt: { type: Date, default: Date.now }
});

const Video = mongoose.models.Video || mongoose.model("Video", videoSchema);

// ── GridFS Storage ────────────────────────────────────────────────────────────
const DB_URL = process.env.DB_URL;

const storage = new GridFsStorage({
  url: DB_URL,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    return {
      bucketName: file.fieldname === "thumbnail" ? "thumbnails" : "videos",
      filename: `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`,
      metadata: {
        originalname: file.originalname,
        mimetype: file.mimetype,
        uploadedBy: req.body?.userId || "unknown",
      },
    };
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "thumbnail") {
      const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (allowed.includes(file.mimetype)) return cb(null, true);
      return cb(new Error("Invalid image type. Only JPEG, PNG, WebP and GIF are allowed."));
    } else {
      const allowed = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];
      if (allowed.includes(file.mimetype)) return cb(null, true);
      return cb(new Error("Invalid video type. Only MP4, WebM, MOV and AVI are allowed."));
    }
  },
});

// ── Helper: build the absolute URL for a GridFS file ────────────────────────
const buildFileUrl = (req, fileId, type = "video") => {
  const base = `${req.protocol}://${req.get("host")}`;
  return `${base}/api/upload/stream/${fileId}?type=${type}`;
};

// ── Helper: format a saved video document URLs ──────────────────────────────
const formatVideoUrls = (video, req) => {
  if (!video) return null;
  const obj = video.toObject ? video.toObject() : { ...video };
  // videoUrl and thumbnail are already absolute https:// URLs from our upload handler
  return obj;
};

// ────────────────────────────────────────────────────────────────────────────
// ROUTES
// ────────────────────────────────────────────────────────────────────────────

// GET  /api/upload/stream/:fileId  – stream a file from GridFS
router.get("/stream/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;
    const { type = "video" } = req.query;

    if (!ObjectId.isValid(fileId)) {
      return res.status(400).json({ error: "Invalid file ID" });
    }

    const db = mongoose.connection.db;
    const bucketName = type === "thumbnail" ? "thumbnails" : "videos";
    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName });

    // Look up the file metadata first so we can set the right Content-Type
    const files = await bucket.find({ _id: new ObjectId(fileId) }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ error: "File not found" });
    }

    const file = files[0];
    const contentType = file.metadata?.mimetype || (type === "thumbnail" ? "image/jpeg" : "video/mp4");

    // Support range requests so browsers can seek in videos
    const fileSize = file.length;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": contentType,
      });

      const downloadStream = bucket.openDownloadStream(new ObjectId(fileId), {
        start,
        end: end + 1,
      });
      downloadStream.pipe(res);
    } else {
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": contentType,
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000",
      });
      const downloadStream = bucket.openDownloadStream(new ObjectId(fileId));
      downloadStream.pipe(res);
    }
  } catch (error) {
    console.error("Stream error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET  /api/upload/user/:userId  – list videos for a user
router.get("/user/:userId", async (req, res) => {
  try {
    const videos = await Video.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    const formatted = videos.map((v) => formatVideoUrls(v, req));
    res.json(formatted);
  } catch (error) {
    console.error("Error fetching user videos:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/upload/video  – upload video (+ optional thumbnail) → GridFS → MongoDB
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

      if (!videoFile) {
        return res.status(400).json({ error: "No video file uploaded" });
      }
      if (!title?.trim()) {
        return res.status(400).json({ error: "Title is required" });
      }

      // Build permanent stream URLs using the GridFS file IDs
      const base = `${req.protocol}://${req.get("host")}`;
      const videoUrl = `${base}/api/upload/stream/${videoFile.id}?type=video`;

      let thumbnail = "";
      if (thumbnailFile) {
        thumbnail = `${base}/api/upload/stream/${thumbnailFile.id}?type=thumbnail`;
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

      res.status(201).json({
        message: "Video uploaded successfully",
        video: video.toObject(),
      });
    } catch (error) {
      console.error("❌ Upload error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// GET  /api/upload/video/:videoId  – get a single video
router.get("/video/:videoId", async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId);
    if (!video) return res.status(404).json({ error: "Video not found" });
    res.json(formatVideoUrls(video, req));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/upload/video/:videoId  – delete video + its GridFS files
router.delete("/video/:videoId", async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId);
    if (!video) return res.status(404).json({ error: "Video not found" });

    const db = mongoose.connection.db;

    // Delete video file from GridFS
    const extractId = (url) => {
      try {
        const u = new URL(url);
        const id = u.pathname.split("/stream/")[1];
        return id && ObjectId.isValid(id) ? new ObjectId(id) : null;
      } catch {
        return null;
      }
    };

    const videoFileId = extractId(video.videoUrl);
    const thumbnailFileId = extractId(video.thumbnail);

    if (videoFileId) {
      const videoBucket = new mongoose.mongo.GridFSBucket(db, { bucketName: "videos" });
      await videoBucket.delete(videoFileId).catch(() => {});
    }
    if (thumbnailFileId) {
      const thumbBucket = new mongoose.mongo.GridFSBucket(db, { bucketName: "thumbnails" });
      await thumbBucket.delete(thumbnailFileId).catch(() => {});
    }

    await Video.findByIdAndDelete(req.params.videoId);
    res.json({ message: "Video deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;