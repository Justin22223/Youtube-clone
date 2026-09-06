import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Video from "@/lib/models/video";
import mongoose from "mongoose";

const uploadToGridFS = (bucketName, buffer, filename, mimetype) =>
  new Promise((resolve, reject) => {
    const db = mongoose.connection.db;
    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName });
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: { mimetype },
    });
    uploadStream.on("error", reject);
    uploadStream.on("finish", () => resolve(uploadStream.id));
    uploadStream.end(buffer);
  });

export async function POST(req) {
  await dbConnect();
  try {
    const formData = await req.formData();
    const title = formData.get("title");
    const description = formData.get("description") || "";
    const userId = formData.get("userId") || "1";
    const visibility = formData.get("visibility") || "public";
    const duration = formData.get("duration") || "00:00";
    
    const videoFile = formData.get("video");
    const thumbnailFile = formData.get("thumbnail");

    if (!videoFile) return NextResponse.json({ error: "No video file uploaded" }, { status: 400 });
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const videoBuffer = Buffer.from(await videoFile.arrayBuffer());
    const videoFileId = await uploadToGridFS(
      "videos",
      videoBuffer,
      `${Date.now()}-${videoFile.name.replace(/\s+/g, "_")}`,
      videoFile.type
    );
    
    const reqUrl = new URL(req.url);
    const host = reqUrl.host;
    const protocol = reqUrl.protocol;
    const streamUrlPrefix = `${protocol}//${host}/api/upload/stream`;
    
    const videoUrl = `${streamUrlPrefix}/${videoFileId}?type=video`;

    let thumbnail;
    if (thumbnailFile && typeof thumbnailFile !== "string") {
      const thumbBuffer = Buffer.from(await thumbnailFile.arrayBuffer());
      const thumbFileId = await uploadToGridFS(
        "thumbnails",
        thumbBuffer,
        `thumb-${Date.now()}.jpg`,
        thumbnailFile.type
      );
      thumbnail = `${streamUrlPrefix}/${thumbFileId}?type=thumbnail`;
    } else {
      thumbnail = `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=random&color=fff&size=320`;
    }

    const video = new Video({
      title: title.trim(),
      description,
      videoUrl,
      thumbnail,
      userId,
      duration,
      visibility,
    });

    await video.save();

    return NextResponse.json({ message: "Video uploaded successfully", video: video.toObject() }, { status: 201 });
  } catch (err) {
    console.error("Upload Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
