import express from "express";
import {
  register,
  login,
  saveFirebaseUser,
  getUserByFirebaseUid,
  getUserProfile,
  updateUserProfile,
  subscribeToChannel,
} from "../controllers/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/firebase/save", saveFirebaseUser);
router.get("/firebase/user/:uid", getUserByFirebaseUid);
router.get("/profile/:id", getUserProfile);
router.put("/profile/:id", updateUserProfile);
router.put("/subscribe/:id", subscribeToChannel);

export default router;