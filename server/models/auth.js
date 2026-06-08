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
}, { timestamps: true });

export default mongoose.model("Auth", AuthSchema);