import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema({
  videoId: { type: String, required: true },
  userId: { type: String, required: true },
  username: { type: String, required: true },
  userAvatar: { type: String, default: "" },
  city: { type: String, default: "Unknown City" },
  text: { type: String, required: true },
  likes: { type: [String], default: [] },
  dislikes: { type: [String], default: [] },
  parentCommentId: { type: String, default: null },
}, { timestamps: true });

export default mongoose.model("Comment", CommentSchema);