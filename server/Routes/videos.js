import express from "express";
import mongoose from "mongoose";
import Video from "../models/Video.js";

const router = express.Router();

// Get all videos
router.get("/", async (req, res) => {
  try {
    const videos = await Video.find({ visibility: "public" }).sort({ createdAt: -1 });
    res.status(200).json(videos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get video by ID - with validation
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if it's a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Video not found" });
    }
    
    const video = await Video.findById(id);
    if (!video) return res.status(404).json({ message: "Video not found" });
    res.status(200).json(video);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get videos by user
router.get("/user/:userId", async (req, res) => {
  try {
    const videos = await Video.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.status(200).json(videos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create video
router.post("/", async (req, res) => {
  try {
    const newVideo = new Video(req.body);
    await newVideo.save();
    res.status(201).json(newVideo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update video views
router.put("/view/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Video not found" });
    }
    
    const video = await Video.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    );
    res.status(200).json(video);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Like video
router.put("/like/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    // Check if it's a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Video not found" });
    }
    
    const video = await Video.findById(id);
    if (!video) return res.status(404).json({ message: "Video not found" });
    
    const hasLiked = video.likes?.includes(userId) || false;
    const hasDisliked = video.dislikes?.includes(userId) || false;
    
    if (hasLiked) {
      await video.updateOne({ $pull: { likes: userId } });
    } else {
      const update = { $push: { likes: userId } };
      if (hasDisliked) {
        update.$pull = { dislikes: userId };
      }
      await video.updateOne(update);
    }
    
    const updatedVideo = await Video.findById(id);
    res.json({ 
      liked: !hasLiked, 
      likesCount: updatedVideo.likes?.length || 0, 
      dislikesCount: updatedVideo.dislikes?.length || 0 
    });
  } catch (error) {
    console.error("Like error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Dislike video
router.put("/dislike/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    // Check if it's a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Video not found" });
    }
    
    const video = await Video.findById(id);
    if (!video) return res.status(404).json({ message: "Video not found" });
    
    const hasDisliked = video.dislikes?.includes(userId) || false;
    const hasLiked = video.likes?.includes(userId) || false;
    
    if (hasDisliked) {
      await video.updateOne({ $pull: { dislikes: userId } });
    } else {
      const update = { $push: { dislikes: userId } };
      if (hasLiked) {
        update.$pull = { likes: userId };
      }
      await video.updateOne(update);
    }
    
    const updatedVideo = await Video.findById(id);
    res.json({ 
      disliked: !hasDisliked, 
      likesCount: updatedVideo.likes?.length || 0, 
      dislikesCount: updatedVideo.dislikes?.length || 0 
    });
  } catch (error) {
    console.error("Dislike error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get like status
router.get("/like-status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;
    
    // Check if it's a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.json({
        liked: false,
        disliked: false,
        likesCount: 0,
        dislikesCount: 0,
      });
    }
    
    const video = await Video.findById(id);
    if (!video) {
      return res.json({
        liked: false,
        disliked: false,
        likesCount: 0,
        dislikesCount: 0,
      });
    }
    
    res.json({
      liked: video.likes?.includes(userId) || false,
      disliked: video.dislikes?.includes(userId) || false,
      likesCount: video.likes?.length || 0,
      dislikesCount: video.dislikes?.length || 0,
    });
  } catch (error) {
    console.error("Like status error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Delete video
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Video not found" });
    }
    
    await Video.findByIdAndDelete(id);
    res.status(200).json({ message: "Video deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;