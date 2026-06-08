import Video from "../models/video.js";

// Get all videos
export const getAllVideos = async (req, res) => {
  try {
    const videos = await Video.find({ visibility: "public" }).sort({ createdAt: -1 });
    res.status(200).json(videos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get video by ID
export const getVideoById = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }
    res.status(200).json(video);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get videos by user
export const getVideosByUser = async (req, res) => {
  try {
    const videos = await Video.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.status(200).json(videos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create video (if not already created in upload route)
export const createVideo = async (req, res) => {
  try {
    const newVideo = new Video(req.body);
    await newVideo.save();
    res.status(201).json(newVideo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete video
export const deleteVideo = async (req, res) => {
  try {
    await Video.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Video deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Increment views
export const incrementViews = async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    res.status(200).json(video);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Like video
export const likeVideo = async (req, res) => {
  try {
    const { userId } = req.body;
    const video = await Video.findById(req.params.id);
    
    if (!video.likes.includes(userId)) {
      await video.updateOne({ $push: { likes: userId }, $pull: { dislikes: userId } });
      res.status(200).json({ message: "Liked" });
    } else {
      await video.updateOne({ $pull: { likes: userId } });
      res.status(200).json({ message: "Unliked" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Dislike video
export const dislikeVideo = async (req, res) => {
  try {
    const { userId } = req.body;
    const video = await Video.findById(req.params.id);
    
    if (!video.dislikes.includes(userId)) {
      await video.updateOne({ $push: { dislikes: userId }, $pull: { likes: userId } });
      res.status(200).json({ message: "Disliked" });
    } else {
      await video.updateOne({ $pull: { dislikes: userId } });
      res.status(200).json({ message: "Undisliked" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};