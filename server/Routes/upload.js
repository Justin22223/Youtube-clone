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

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
}

// Define Video Schema
const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  videoUrl: { type: String, required: true },
  thumbnail: { type: String, default: "" },
  userId: { type: String, required: true },
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
    cb(null, videosDir);
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
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only MP4, WebM, and MOV are allowed.'));
    }
  }
});

// ============ ROUTES ============

// GET videos by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const videos = await Video.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(videos);
  } catch (error) {
    console.error("Error fetching user videos:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST upload video
router.post('/video', upload.single('video'), async (req, res) => {
  try {
    console.log("Upload request received");
    console.log("Body:", req.body);
    console.log("File:", req.file);
    
    const { title, description, userId, visibility } = req.body;
    const videoFile = req.file;
    
    if (!videoFile) {
      return res.status(400).json({ error: "No video file uploaded" });
    }
    
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }
    
    // Create video URL
    const videoUrl = `/uploads/videos/${videoFile.filename}`;
    
    // Create thumbnail URL (using UI Avatars as placeholder)
    const thumbnail = `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=random&color=fff&size=320`;
    
    const video = new Video({
      title: title.trim(),
      description: description || "",
      videoUrl: videoUrl,
      thumbnail: thumbnail,
      userId: userId || "1",
      views: 0,
      likes: [],
      dislikes: []
    });
    
    await video.save();
    console.log("Video saved:", video._id);
    
    res.status(201).json({ 
      message: "Video uploaded successfully", 
      video: video 
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
    res.json(video);
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