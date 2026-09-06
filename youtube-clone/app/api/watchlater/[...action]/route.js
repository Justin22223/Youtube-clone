import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import WatchLater from "@/lib/models/watchlater";

export async function GET(req, { params }) {
  await dbConnect();
  const { action } = await params;
  const path = action.join("/");

  try {
    if (path.startsWith("check/")) {
      const parts = path.split("/");
      const userId = parts[1];
      const videoId = parts[2];
      
      const item = await WatchLater.findOne({ userId, videoId });
      return NextResponse.json({ isInWatchLater: !!item, id: item?._id || null }, { status: 200 });
    }

    // Assuming GET /api/watchlater/${userId}
    if (path.length > 0 && !path.includes("/")) {
      const userId = path;
      const videos = await WatchLater.find({ userId }).sort({ createdAt: -1 });
      return NextResponse.json(videos, { status: 200 });
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
      const body = await req.json();
      const existing = await WatchLater.findOne({ userId: body.userId, videoId: body.videoId });
      if (existing) {
        return NextResponse.json({ message: "Already in watch later" }, { status: 200 });
      }
      
      const newItem = new WatchLater(body);
      await newItem.save();
      return NextResponse.json(newItem, { status: 201 });
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
    if (path.startsWith("user/")) {
      // DELETE /api/watchlater/user/${userId}/video/${videoId}
      const parts = path.split("/");
      const userId = parts[1];
      const videoId = parts[3];
      
      await WatchLater.findOneAndDelete({ userId, videoId });
      return NextResponse.json({ message: "Removed from watch later" }, { status: 200 });
    }

    if (path.startsWith("clear/")) {
      const userId = path.split("/")[1];
      await WatchLater.deleteMany({ userId });
      return NextResponse.json({ message: "Cleared watch later" }, { status: 200 });
    }

    // DELETE /api/watchlater/${id}
    if (path.length > 0 && !path.includes("/")) {
      const id = path;
      await WatchLater.findByIdAndDelete(id);
      return NextResponse.json({ message: "Removed from watch later" }, { status: 200 });
    }

    return NextResponse.json({ message: "Route not found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
