import mongoose from "mongoose";
import Video from "./models/video.js";
import Auth from "./models/auth.js";

const uri = "mongodb://admin:admin@ac-a2gjngl-shard-00-00.qbruw7s.mongodb.net:27017,ac-a2gjngl-shard-00-01.qbruw7s.mongodb.net:27017,ac-a2gjngl-shard-00-02.qbruw7s.mongodb.net:27017/youtube?ssl=true&replicaSet=atlas-537it5-shard-0&authSource=admin&appName=db";

const testVideos = [
  {
    title: "Big Buck Bunny - 60fps 4K",
    description: "Big Buck Bunny tells the story of a giant rabbit with a heart bigger than himself.",
    thumbnail: "https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    duration: "09:56",
    views: 1542010,
    visibility: "public",
  },
  {
    title: "Elephant Dream",
    description: "The first Blender Open Movie from 2006",
    thumbnail: "https://i.ytimg.com/vi/eRsGyueVLvQ/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=eRsGyueVLvQ",
    duration: "10:53",
    views: 890000,
    visibility: "public",
  },
  {
    title: "For Bigger Blazes",
    description: "HBO GO now works with Chromecast",
    thumbnail: "https://i.ytimg.com/vi/aAObLszJ72s/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=aAObLszJ72s",
    duration: "00:15",
    views: 12040,
    visibility: "public",
  },
  {
    title: "For Bigger Escapes",
    description: "Introducing Chromecast. The easiest way to enjoy online video and music on your TV.",
    thumbnail: "https://i.ytimg.com/vi/h2-5AozxUHQ/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=h2-5AozxUHQ",
    duration: "00:15",
    views: 45000,
    visibility: "public",
  },
  {
    title: "Sintel - Blender Open Movie",
    description: "Sintel is an independently produced short film, initiated by the Blender Foundation as a means to further improve and validate the free/open source 3D creation suite Blender.",
    thumbnail: "https://i.ytimg.com/vi/eRsGyueVLvQ/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=eRsGyueVLvQ",
    duration: "14:48",
    views: 5600000,
    visibility: "public",
  },
  {
    title: "Tears of Steel",
    description: "Tears of Steel was realized with crowd-funding by users of the open source 3D creation tool Blender.",
    thumbnail: "https://i.ytimg.com/vi/R6MlUcmOul8/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=R6MlUcmOul8",
    duration: "12:14",
    views: 3400000,
    visibility: "public",
  },
  {
    title: "Volkswagen GTI Review",
    description: "The Volkswagen GTI is the original hot hatch.",
    thumbnail: "https://i.ytimg.com/vi/AqQ109-1Ams/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=AqQ109-1Ams",
    duration: "09:53",
    views: 750000,
    visibility: "public",
  },
  {
    title: "We Are Going On Bullrun",
    description: "The Bullrun routing strategy.",
    thumbnail: "https://i.ytimg.com/vi/Vv5wM7_B4_Q/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=Vv5wM7_B4_Q",
    duration: "00:47",
    views: 23000,
    visibility: "public",
  }
];

async function seed() {
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");

    // Check if we have any users to assign these videos to
    let user = await Auth.findOne();
    if (!user) {
      console.log("No users found, creating a dummy user...");
      user = await Auth.create({
        username: "DemoChannel",
        channelName: "Demo Channel",
        email: "demo@example.com",
        password: "hashedpassword123", // Dummy
        avatar: "https://ui-avatars.com/api/?name=Demo&background=E74C3C&color=fff&size=64"
      });
    }

    const userId = user._id.toString();

    // Optionally, clear old videos
    // await Video.deleteMany({});
    
    console.log("Inserting test videos...");
    const videosWithUser = testVideos.map(v => ({ ...v, userId }));
    
    await Video.insertMany(videosWithUser);
    
    console.log(`Successfully seeded ${videosWithUser.length} playable videos assigned to user ${user.username}`);
    process.exit(0);
  } catch (err) {
    console.error("Error seeding data:", err);
    process.exit(1);
  }
}

seed();
