import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const url = "mongodb://admin:admin@ac-a2gjngl-shard-00-00.qbruw7s.mongodb.net:27017,ac-a2gjngl-shard-00-01.qbruw7s.mongodb.net:27017,ac-a2gjngl-shard-00-02.qbruw7s.mongodb.net:27017/youtube?ssl=true&replicaSet=atlas-537it5-shard-0&authSource=admin&appName=db";

mongoose.connect(url)
  .then(async () => {
    const videoSchema = new mongoose.Schema({
      title: String,
      videoUrl: String,
      thumbnail: String,
      createdAt: Date,
    });
    const Video = mongoose.models.Video || mongoose.model("Video", videoSchema);
    
    // Find the latest video titled "Stairs"
    const video = await Video.findOne({ title: "Stairs" }).sort({ createdAt: -1 });
    if (video) {
      console.log("Found video 'Stairs':");
      console.log("ID:", video._id);
      console.log("Title:", video.title);
      console.log("Video URL:", video.videoUrl);
      console.log("Thumbnail URL:", video.thumbnail);
    } else {
      console.log("No video named 'Stairs' found.");
      const all = await Video.find({}).sort({ createdAt: -1 }).limit(3);
      console.log("Latest videos in database:", all.map(v => ({ title: v.title, thumbnail: v.thumbnail })));
    }
    process.exit(0);
  })
  .catch(err => {
    console.error("Connection failed:", err);
    process.exit(1);
  });
