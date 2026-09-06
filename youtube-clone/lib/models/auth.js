import mongoose from "mongoose";

const AuthSchema = new mongoose.Schema({
  firebaseUid: { type: String, unique: true, sparse: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  avatar: { type: String, default: "https://ui-avatars.com/api/?background=random&color=fff&size=128" },
  banner: { type: String, default: "" },
  channelName: { type: String, default: "" },
  channelDescription: { type: String, default: "" },
  subscribers: { type: Number, default: 0 },
  subscribedUsers: { type: [String], default: [] },
  totalViews: { type: Number, default: 0 },
  authProvider: { type: String, enum: ["email", "google"], default: "email" },
  mobileNumber: { type: String },
  otp: { type: String },
  otpExpiresAt: { type: Date },
  isPremium: { type: Boolean, default: false },
  plan: { type: String, enum: ["Free", "Bronze", "Silver", "Gold"], default: "Free" },
  downloadedVideos: { type: [String], default: [] },
  downloadCountToday: { type: Number, default: 0 },
  lastDownloadDate: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.models.Auth || mongoose.model("Auth", AuthSchema);
