import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";

export async function GET(req, { params }) {
  await dbConnect();
  try {
    const { fileId } = await params;
    const url = new URL(req.url);
    const type = url.searchParams.get("type") === "thumbnail" ? "thumbnail" : "video";

    if (!ObjectId.isValid(fileId)) {
      return NextResponse.json({ error: "Invalid file ID" }, { status: 400 });
    }

    const db = mongoose.connection.db;
    const bucketName = type === "thumbnail" ? "thumbnails" : "videos";
    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName });
    const oid = new ObjectId(fileId);

    const files = await bucket.find({ _id: oid }).toArray();
    if (!files.length) return NextResponse.json({ error: "File not found" }, { status: 404 });

    const file = files[0];
    const contentType = file.metadata?.mimetype || (type === "thumbnail" ? "image/jpeg" : "video/mp4");
    const fileSize = file.length;

    const range = req.headers.get("range");
    if (range) {
      const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
      const start = parseInt(startStr, 10);
      const end = endStr ? parseInt(endStr, 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const downloadStream = bucket.openDownloadStream(oid, { start, end: end + 1 });

      const headers = new Headers();
      headers.set("Content-Range", `bytes ${start}-${end}/${fileSize}`);
      headers.set("Accept-Ranges", "bytes");
      headers.set("Content-Length", chunkSize.toString());
      headers.set("Content-Type", contentType);

      // Convert Node.js readable stream to Web ReadableStream
      const stream = new ReadableStream({
        start(controller) {
          downloadStream.on('data', (chunk) => {
            try {
              controller.enqueue(new Uint8Array(chunk));
            } catch (e) {
              downloadStream.destroy();
            }
          });
          downloadStream.on('end', () => {
            try { controller.close(); } catch (e) {}
          });
          downloadStream.on('error', (error) => {
            try { controller.error(error); } catch (e) {}
          });
        }
      });

      return new NextResponse(stream, { status: 206, headers });
    } else {
      const downloadStream = bucket.openDownloadStream(oid);

      const headers = new Headers();
      headers.set("Content-Length", fileSize.toString());
      headers.set("Content-Type", contentType);
      headers.set("Accept-Ranges", "bytes");
      headers.set("Cache-Control", "public, max-age=31536000");

      const stream = new ReadableStream({
        start(controller) {
          downloadStream.on('data', (chunk) => {
            try {
              controller.enqueue(new Uint8Array(chunk));
            } catch (e) {
              downloadStream.destroy();
            }
          });
          downloadStream.on('end', () => {
            try { controller.close(); } catch (e) {}
          });
          downloadStream.on('error', (error) => {
            try { controller.error(error); } catch (e) {}
          });
        }
      });

      return new NextResponse(stream, { status: 200, headers });
    }
  } catch (err) {
    console.error("Stream error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
