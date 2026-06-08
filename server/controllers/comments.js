import Comment from "../models/Comment.js";

// Get comments for a video
export const getComments = async (req, res) => {
  try {
    const { videoId } = req.params;
    const comments = await Comment.find({ videoId, parentCommentId: null })
      .sort({ createdAt: -1 });
    
    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({ parentCommentId: comment._id })
          .sort({ createdAt: 1 });
        return { ...comment.toObject(), replies };
      })
    );
    
    res.status(200).json(commentsWithReplies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a comment
export const addComment = async (req, res) => {
  try {
    const { videoId, userId, username, userAvatar, text, parentCommentId } = req.body;
    
    const newComment = new Comment({
      videoId,
      userId,
      username,
      userAvatar: userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random&color=fff&size=40`,
      text,
      parentCommentId: parentCommentId || null,
    });
    
    await newComment.save();
    
    if (parentCommentId) {
      await Comment.findByIdAndUpdate(parentCommentId, {
        $push: { replies: newComment._id }
      });
    }
    
    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Like a comment
export const likeComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    const comment = await Comment.findById(id);
    const hasLiked = comment.likes.includes(userId);
    const hasDisliked = comment.dislikes.includes(userId);
    
    if (hasLiked) {
      await comment.updateOne({ $pull: { likes: userId } });
    } else {
      const update = { $push: { likes: userId } };
      if (hasDisliked) {
        update.$pull = { dislikes: userId };
      }
      await comment.updateOne(update);
    }
    
    res.status(200).json({ message: "Success" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Dislike a comment
export const dislikeComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    const comment = await Comment.findById(id);
    const hasDisliked = comment.dislikes.includes(userId);
    const hasLiked = comment.likes.includes(userId);
    
    if (hasDisliked) {
      await comment.updateOne({ $pull: { dislikes: userId } });
    } else {
      const update = { $push: { dislikes: userId } };
      if (hasLiked) {
        update.$pull = { likes: userId };
      }
      await comment.updateOne(update);
    }
    
    res.status(200).json({ message: "Success" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete comment
export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findById(id);
    
    if (comment.parentCommentId) {
      await Comment.findByIdAndUpdate(comment.parentCommentId, {
        $pull: { replies: id }
      });
    }
    
    await Comment.deleteMany({ parentCommentId: id });
    await Comment.findByIdAndDelete(id);
    
    res.status(200).json({ message: "Comment deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};