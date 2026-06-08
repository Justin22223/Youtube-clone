import express from "express";
import Comment from "../models/Comment.js";

const router = express.Router();

router.get("/:videoId", async (req, res) => {
  try {
    const comments = await Comment.find({ videoId: req.params.videoId }).sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const newComment = new Comment(req.body);
    await newComment.save();
    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/like/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const comment = await Comment.findById(id);
    
    if (comment.likes.includes(userId)) {
      await comment.updateOne({ $pull: { likes: userId } });
    } else {
      await comment.updateOne({ $push: { likes: userId }, $pull: { dislikes: userId } });
    }
    res.json({ message: "Success" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;