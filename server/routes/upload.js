import express from "express";
import multer from "multer";
import path from "path";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "../uploads");
const videosDir = path.join(uploadDir, "videos");
const thumbnailsDir = path.join(uploadDir, "thumbnails");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
}
if (!fs.existsSync(thumbnailsDir)) {
  fs.mkdirSync(thumbnailsDir, { recursive: true });
}

// Define Video Schema
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

// Create Video model
const Video = mongoose.models.Video || mongoose.model('Video', videoSchema);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "thumbnail") {
      cb(null, thumbnailsDir);
    } else {
      cb(null, videosDir);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "thumbnail") {
      const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (allowedImageTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid image type for thumbnail. Only JPEG, PNG, and WebP are allowed.'));
      }
    } else {
      const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
      if (allowedVideoTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only MP4, WebM, and MOV are allowed.'));
      }
    }
  }
});

// Helper to format relative video and thumbnail paths to absolute URLs
const formatVideoUrls = (video, req) => {
  if (!video) return null;
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const videoObj = video.toObject ? video.toObject() : video;
  
  if (videoObj.videoUrl && !videoObj.videoUrl.startsWith('http')) {
    videoObj.videoUrl = `${baseUrl}${videoObj.videoUrl}`;
  }
  if (videoObj.thumbnail && !videoObj.thumbnail.startsWith('http')) {
    videoObj.thumbnail = `${baseUrl}${videoObj.thumbnail}`;
  }
  return videoObj;
};

// ============ ROUTES ============

// GET videos by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const videos = await Video.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    const formattedVideos = videos.map(video => formatVideoUrls(video, req));
    res.json(formattedVideos);
  } catch (error) {
    console.error("Error fetching user videos:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST upload video
router.post('/video', upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log("Upload request received");
    console.log("Body:", req.body);
    console.log("Files:", req.files);
    
    const { title, description, userId, visibility, duration } = req.body;
    const videoFile = req.files && req.files['video'] ? req.files['video'][0] : null;
    const thumbnailFile = req.files && req.files['thumbnail'] ? req.files['thumbnail'][0] : null;
    
    if (!videoFile) {
      return res.status(400).json({ error: "No video file uploaded" });
    }
    
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }
    
    // Create video URL
    const videoUrl = `/uploads/videos/${videoFile.filename}`;
    
    // Set thumbnail URL
    let thumbnail = "";
    if (thumbnailFile) {
      thumbnail = `/uploads/thumbnails/${thumbnailFile.filename}`;
    } else {
      thumbnail = `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=random&color=fff&size=320`;
    }
    
    const video = new Video({
      title: title.trim(),
      description: description || "",
      videoUrl: videoUrl,
      thumbnail: thumbnail,
      userId: userId || "1",
      duration: duration || "00:00",
      visibility: visibility || "public",
      views: 0,
      likes: [],
      dislikes: []
    });
    
    await video.save();
    console.log("Video saved:", video._id);
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const videoObj = video.toObject();
    if (videoObj.videoUrl && !videoObj.videoUrl.startsWith('http')) {
      videoObj.videoUrl = `${baseUrl}${videoObj.videoUrl}`;
    }
    if (videoObj.thumbnail && !videoObj.thumbnail.startsWith('http')) {
      videoObj.thumbnail = `${baseUrl}${videoObj.thumbnail}`;
    }

    res.status(201).json({ 
      message: "Video uploaded successfully", 
      video: videoObj 
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET single video
router.get('/video/:videoId', async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId);
    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }
    res.json(formatVideoUrls(video, req));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE video
router.delete('/video/:videoId', async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId);
    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }
    
    // Delete video file
    const videoPath = path.join(__dirname, "..", video.videoUrl);
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }
    
    await Video.findByIdAndDelete(req.params.videoId);
    res.json({ message: "Video deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;