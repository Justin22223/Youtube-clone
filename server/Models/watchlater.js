import mongoose from "mongoose";

const WatchLaterSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    videoId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    channel: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
      default: "",
    },
    duration: {
      type: String,
      default: "00:00",
    },
    views: {
      type: String,
      default: "0 views",
    },
    timestamp: {
      type: String,
      default: "",
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index to ensure a user can only add a video once to watch later
WatchLaterSchema.index({ userId: 1, videoId: 1 }, { unique: true });

export default mongoose.model("WatchLater", WatchLaterSchema);