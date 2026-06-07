import mongoose from "mongoose";

const VideoSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    thumbnail: {
      type: String,
      default: "",
    },
    videoUrl: {
      type: String,
      required: true,
    },
    duration: {
      type: String,
      default: "00:00",
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: [String],
      default: [],
    },
    dislikes: {
      type: [String],
      default: [],
    },
    visibility: {
      type: String,
      enum: ["public", "unlisted", "private"],
      default: "public",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Video", VideoSchema);