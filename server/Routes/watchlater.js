import express from "express";
import WatchLater from "../models/watchlater.js";

const router = express.Router();

// Get all watch later videos for a user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const watchLater = await WatchLater.find({ userId }).sort({ addedAt: -1 });
    res.status(200).json(watchLater);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add video to watch later
router.post("/", async (req, res) => {
  try {
    const { userId, videoId, title, channel, thumbnail, duration, views, timestamp } = req.body;
    
    // Check if already exists
    const existing = await WatchLater.findOne({ userId, videoId });
    if (existing) {
      return res.status(400).json({ message: "Video already in watch later" });
    }
    
    const watchLaterItem = new WatchLater({
      userId,
      videoId,
      title,
      channel,
      thumbnail,
      duration,
      views,
      timestamp,
      addedAt: new Date(),
    });
    
    await watchLaterItem.save();
    res.status(201).json({ message: "Added to watch later", item: watchLaterItem });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove video from watch later
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await WatchLater.findByIdAndDelete(id);
    res.status(200).json({ message: "Removed from watch later" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove by videoId and userId
router.delete("/user/:userId/video/:videoId", async (req, res) => {
  try {
    const { userId, videoId } = req.params;
    await WatchLater.findOneAndDelete({ userId, videoId });
    res.status(200).json({ message: "Removed from watch later" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Check if video is in watch later
router.get("/check/:userId/:videoId", async (req, res) => {
  try {
    const { userId, videoId } = req.params;
    const exists = await WatchLater.findOne({ userId, videoId });
    res.status(200).json({ isInWatchLater: !!exists, id: exists?._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Clear all watch later for a user
router.delete("/clear/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    await WatchLater.deleteMany({ userId });
    res.status(200).json({ message: "Watch later cleared" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;