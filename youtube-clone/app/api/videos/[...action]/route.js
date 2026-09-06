import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Video from "@/lib/models/video";

export async function GET(req, { params }) {
  await dbConnect();
  const { action } = await params;
  const path = action.join("/");

  try {
    if (path === "all") {
      const videos = await Video.find({ visibility: "public" }).sort({ createdAt: -1 });
      return NextResponse.json(videos, { status: 200 });
    }
    
    if (path.startsWith("user/")) {
      const userId = path.split("/")[1];
      const videos = await Video.find({ userId }).sort({ createdAt: -1 });
      return NextResponse.json(videos, { status: 200 });
    }
    
    if (path.startsWith("video/")) {
      const id = path.split("/")[1];
      const video = await Video.findById(id);
      if (!video) return NextResponse.json({ message: "Video not found" }, { status: 404 });
      return NextResponse.json(video, { status: 200 });
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
    if (path === "create") {
      const body = await req.json();
      const newVideo = new Video(body);
      await newVideo.save();
      return NextResponse.json(newVideo, { status: 201 });
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
    if (path.startsWith("views/")) {
      const id = path.split("/")[1];
      const video = await Video.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true });
      return NextResponse.json(video, { status: 200 });
    }

    if (path.startsWith("like/")) {
      const id = path.split("/")[1];
      const { userId } = await req.json();
      const video = await Video.findById(id);
      if (!video.likes.includes(userId)) {
        await video.updateOne({ $push: { likes: userId }, $pull: { dislikes: userId } });
        return NextResponse.json({ message: "Liked" }, { status: 200 });
      } else {
        await video.updateOne({ $pull: { likes: userId } });
        return NextResponse.json({ message: "Unliked" }, { status: 200 });
      }
    }

    if (path.startsWith("dislike/")) {
      const id = path.split("/")[1];
      const { userId } = await req.json();
      const video = await Video.findById(id);
      if (!video.dislikes.includes(userId)) {
        await video.updateOne({ $push: { dislikes: userId }, $pull: { likes: userId } });
        return NextResponse.json({ message: "Disliked" }, { status: 200 });
      } else {
        await video.updateOne({ $pull: { dislikes: userId } });
        return NextResponse.json({ message: "Undisliked" }, { status: 200 });
      }
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
    if (path.startsWith("video/")) {
      const id = path.split("/")[1];
      await Video.findByIdAndDelete(id);
      return NextResponse.json({ message: "Video deleted successfully" }, { status: 200 });
    }
    return NextResponse.json({ message: "Route not found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
