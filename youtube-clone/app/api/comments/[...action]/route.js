import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Comment from "@/lib/models/Comment";
import translate from "translate";

export async function GET(req, { params }) {
  await dbConnect();
  const { action } = await params;
  const path = action.join("/");

  try {
    if (path.startsWith("video/")) {
      const videoId = path.split("/")[1];
      const comments = await Comment.find({ videoId, parentCommentId: null }).sort({ createdAt: -1 });

      const commentsWithReplies = await Promise.all(
        comments.map(async (comment) => {
          const replies = await Comment.find({ parentCommentId: comment._id }).sort({ createdAt: 1 });
          return { ...comment.toObject(), replies };
        })
      );

      return NextResponse.json(commentsWithReplies, { status: 200 });
    }

    // Direct video ID
    if (path.length === 24) {
      const comments = await Comment.find({ videoId: path, parentCommentId: null }).sort({ createdAt: -1 });

      const commentsWithReplies = await Promise.all(
        comments.map(async (comment) => {
          const replies = await Comment.find({ parentCommentId: comment._id }).sort({ createdAt: 1 });
          return { ...comment.toObject(), replies };
        })
      );

      return NextResponse.json(commentsWithReplies, { status: 200 });
    }

    return NextResponse.json({ message: "Route not found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  await dbConnect();
  const { action } = await params;
  const path = action.join("/");

  try {
    if (path === "add") {
      const { videoId, userId, username, userAvatar, city, text, parentCommentId } = await req.json();

      const specialCharsRegex = /[@#$%^&*<>{}[\]|\\~]/;
      if (specialCharsRegex.test(text)) {
        return NextResponse.json({ message: "Comment contains special characters which are not allowed." }, { status: 400 });
      }

      const newComment = new Comment({
        videoId,
        userId,
        username,
        userAvatar: userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random&color=fff&size=40`,
        city: city || "Unknown City",
        text,
        parentCommentId: parentCommentId || null,
      });

      await newComment.save();

      if (parentCommentId) {
        await Comment.findByIdAndUpdate(parentCommentId, {
          $push: { replies: newComment._id }
        });
      }

      return NextResponse.json(newComment, { status: 201 });
    }

    if (path === "translate") {
      const { text, targetLang } = await req.json();
      try {
        translate.engine = "google";
        const translatedText = await translate(text, targetLang);
        return NextResponse.json({ translatedText }, { status: 200 });
      } catch (err) {
        return NextResponse.json({ message: "Translation failed" }, { status: 500 });
      }
    }

    return NextResponse.json({ message: "Route not found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  await dbConnect();
  const { action } = await params;
  const path = action.join("/");

  try {
    if (path.startsWith("like/")) {
      const id = path.split("/")[1];
      const { userId } = await req.json();

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
      return NextResponse.json({ message: "Success" }, { status: 200 });
    }

    if (path.startsWith("dislike/")) {
      const id = path.split("/")[1];
      const { userId } = await req.json();

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

        const updatedComment = await Comment.findById(id);
        if (updatedComment.dislikes.length >= 2) {
          if (updatedComment.parentCommentId) {
            await Comment.findByIdAndUpdate(updatedComment.parentCommentId, {
              $pull: { replies: id }
            });
          }
          await Comment.deleteMany({ parentCommentId: id });
          await Comment.findByIdAndDelete(id);
          return NextResponse.json({ message: "Comment removed due to too many dislikes", removed: true }, { status: 200 });
        }
      }
      return NextResponse.json({ message: "Success" }, { status: 200 });
    }

    return NextResponse.json({ message: "Route not found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  await dbConnect();
  const { action } = await params;
  const path = action.join("/");

  try {
    if (path.length === 24) {
      const id = path;
      const comment = await Comment.findById(id);
      if (comment) {
        if (comment.parentCommentId) {
          await Comment.findByIdAndUpdate(comment.parentCommentId, {
            $pull: { replies: id }
          });
        }
        await Comment.deleteMany({ parentCommentId: id });
        await Comment.findByIdAndDelete(id);
      }
      return NextResponse.json({ message: "Comment deleted" }, { status: 200 });
    }
    return NextResponse.json({ message: "Route not found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
