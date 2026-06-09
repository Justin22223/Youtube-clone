import mongoose from "mongoose";
import dotenv from "dotenv";
import Video from "./models/video.js";

dotenv.config();

const DB_URL = "mongodb://admin:admin@ac-tn0jhd4-shard-00-00.0gf7bjg.mongodb.net:27017,ac-tn0jhd4-shard-00-01.0gf7bjg.mongodb.net:27017,ac-tn0jhd4-shard-00-02.0gf7bjg.mongodb.net:27017/youtube?ssl=true&replicaSet=atlas-11gsr9-shard-0&authSource=admin&appName=Cluster0";

const sampleVideos = [
  {
    userId: "system",
    title: "Building a YouTube Clone with Next.js and shadcn/ui",
    description: "In this video, we'll build a complete YouTube clone using Next.js 15, Tailwind CSS, and shadcn/ui components.",
    thumbnail: "https://img.youtube.com/vi/1wkPMUZ9vX4/mqdefault.jpg",
    videoUrl: "https://www.youtube.com/embed/1wkPMUZ9vX4?autoplay=1&rel=0&modestbranding=1",
    duration: "45:30",
    views: 124000,
    likes: [],
    dislikes: [],
    visibility: "public"
  },
  {
    userId: "system",
    title: "The Future of AI in 2025",
    description: "What will AI look like in the near future?",
    thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400",
    videoUrl: "https://www.youtube.com/embed/jNQXAC9IVRw?autoplay=1",
    duration: "22:15",
    views: 89000,
    likes: [],
    dislikes: [],
    visibility: "public"
  },
  {
    userId: "system",
    title: "Top 10 JavaScript Frameworks to Learn",
    description: "The top JS frameworks you need to know this year.",
    thumbnail: "https://images.unsplash.com/photo-1592609931095-54a2168ae893?w=400",
    videoUrl: "https://www.youtube.com/embed/jNQXAC9IVRw?autoplay=1",
    duration: "18:42",
    views: 256000,
    likes: [],
    dislikes: [],
    visibility: "public"
  },
  {
    userId: "system",
    title: "How to Build a Startup from Scratch",
    description: "A complete guide to building your own startup.",
    thumbnail: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400",
    videoUrl: "https://www.youtube.com/embed/jNQXAC9IVRw?autoplay=1",
    duration: "32:10",
    views: 45000,
    likes: [],
    dislikes: [],
    visibility: "public"
  },
  {
    userId: "system",
    title: "Mastering React Server Components",
    description: "Deep dive into RSCs.",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400",
    videoUrl: "https://www.youtube.com/embed/jNQXAC9IVRw?autoplay=1",
    duration: "28:33",
    views: 312000,
    likes: [],
    dislikes: [],
    visibility: "public"
  },
  {
    userId: "system",
    title: "Amazing Nature Documentary",
    description: "Explore the beautiful nature.",
    thumbnail: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400",
    videoUrl: "https://www.youtube.com/embed/jNQXAC9IVRw?autoplay=1",
    duration: "45:00",
    views: 1200000,
    likes: [],
    dislikes: [],
    visibility: "public"
  }
];

mongoose.connect(DB_URL)
  .then(async () => {
    console.log("Connected to MongoDB");
    await Video.insertMany(sampleVideos);
    console.log("Mock videos seeded successfully!");
    mongoose.disconnect();
  })
  .catch((err) => {
    console.error("Error seeding videos", err);
    mongoose.disconnect();
  });
