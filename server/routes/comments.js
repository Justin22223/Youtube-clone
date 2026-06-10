import express from "express";
import { getComments, addComment, likeComment, dislikeComment, deleteComment } from "../controllers/comments.js";

const router = express.Router();

router.get("/:videoId", getComments);
router.post("/", addComment);
router.put("/like/:id", likeComment);
router.put("/dislike/:id", dislikeComment);
router.delete("/:id", deleteComment);

export default router;