import express from "express";
import {
  register,
  login,
  verifyOtp,
  saveFirebaseUser,
  getUserByFirebaseUid,
  getUserProfile,
  updateUserProfile,
  subscribeToChannel,
  trackDownload,
  getDownloads,
} from "../controllers/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verify-otp", verifyOtp);
router.post("/firebase/save", saveFirebaseUser);
router.get("/firebase/user/:uid", getUserByFirebaseUid);
router.get("/profile/:id", getUserProfile);
router.put("/profile/:id", updateUserProfile);
router.put("/subscribe/:id", subscribeToChannel);
router.post("/download/:videoId", trackDownload);
router.get("/downloads/:userId", getDownloads);

export default router;