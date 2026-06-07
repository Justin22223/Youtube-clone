import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import Video from "../models/Video.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory
const uploadDir = path.join(__dirname, "../uploads/videos");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });

// GET videos by userId
router.get("/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log("GET videos for userId:", userId);
    const videos = await Video.find({ userId: userId }).sort({ createdAt: -1 });
    console.log("Found:", videos.length);
    res.json(videos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST upload video
router.post("/video", upload.single("video"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file" });
    }

    const { title, description, userId, visibility } = req.body;
    
    const videoUrl = `http://localhost:5000/uploads/videos/${req.file.filename}`;
    const thumbnail = `https://ui-avatars.com/api/?name=${encodeURIComponent(title || "Video")}&background=random&color=fff&size=320`;

    const video = new Video({
      userId,
      title: title || "Untitled",
      description: description || "",
      thumbnail,
      videoUrl,
      visibility: visibility || "public",
    });

    await video.save();
    console.log("Video saved:", video._id);
    
    res.json({ success: true, video });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET single video by ID
router.get("/video/:id", async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: "Not found" });
    res.json(video);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;