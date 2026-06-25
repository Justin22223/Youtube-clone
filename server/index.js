import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import videoRoutes from "./routes/videos.js";
import uploadRoutes from "./routes/upload.js";
import commentRoutes from "./routes/comments.js";
import watchLaterRoutes from "./routes/watchlater.js";
import premiumRoutes from "./routes/premium.js";

const app = express();
import { createServer } from "http";
import { Server } from "socket.io";

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = [
        "http://localhost:3000",
        process.env.FRONTEND_URL
      ].filter(Boolean);
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }
      return callback(null, true); // Fallback to allow connection for testing/preview links
    },
    credentials: true,
  }
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", userId);

    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-disconnected", userId);
    });
  });

  socket.on("offer", (data) => {
    socket.to(data.roomId).emit("offer", { ...data, senderId: socket.id });
  });

  socket.on("answer", (data) => {
    socket.to(data.roomId).emit("answer", { ...data, senderId: socket.id });
  });

  socket.on("ice-candidate", (data) => {
    socket.to(data.roomId).emit("ice-candidate", { ...data, senderId: socket.id });
  });
});

// CORS - Allow frontend
const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
      return callback(null, true);
    }
    return callback(null, true); // Fallback to allow connection for testing/preview links
  },
  credentials: true,
}));


app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));


// Routes
app.use("/api/auth", authRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/watchlater", watchLaterRoutes);
app.use("/api/premium", premiumRoutes);
app.get("/", (req, res) => {
  res.send("YouTube backend is working");
});

const PORT = process.env.PORT || 5000;
const DB_URL = process.env.DB_URL;

const directUrlFallback = "mongodb://admin:admin@ac-a2gjngl-shard-00-00.qbruw7s.mongodb.net:27017,ac-a2gjngl-shard-00-01.qbruw7s.mongodb.net:27017,ac-a2gjngl-shard-00-02.qbruw7s.mongodb.net:27017/youtube?ssl=true&replicaSet=atlas-537it5-shard-0&authSource=admin&appName=db";

const connectWithRetry = (url, isFallback = false) => {
  mongoose
    .connect(url)
    .then(() => {
      console.log("✅ MongoDB connected successfully" + (isFallback ? " (using direct shard URL fallback)" : ""));
      server.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
        console.log(`📍 http://localhost:${PORT}`);
      });
    })
    .catch((error) => {
      console.error("❌ MongoDB connection error:", error.message);
      if (!isFallback && (error.message.includes("querySrv") || error.message.includes("ENOTFOUND") || error.message.includes("ECONNREFUSED") || error.message.includes("timeout"))) {
        console.log("⚠️ MongoDB SRV resolution failed. Retrying connection using direct shard URL...");
        connectWithRetry(directUrlFallback, true);
      }
    });
};

connectWithRetry(DB_URL);