"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface Video {
  id: string;
  title: string;
  channel: string;
  channelAvatar: string;
  thumbnail: string;
  views: string;
  timestamp: string;
  duration: string;
  isYouTube?: boolean;
  youtubeId?: string;
}

const sampleVideos: Video[] = [
  {
    id: "1",
    title: "Building a YouTube Clone with Next.js and shadcn/ui",
    channel: "CodeMaster",
    channelAvatar: "https://ui-avatars.com/api/?name=CodeMaster&background=E74C3C&color=fff&size=32",
    thumbnail: "https://img.youtube.com/vi/1wkPMUZ9vX4/mqdefault.jpg",
    views: "124K views",
    timestamp: "2 days ago",
    duration: "45:30",
    isYouTube: true,
    youtubeId: "1wkPMUZ9vX4",
  },
  {
    id: "2",
    title: "The Future of AI in 2025",
    channel: "TechToday",
    channelAvatar: "https://ui-avatars.com/api/?name=TechToday&background=3498DB&color=fff&size=32",
    thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400",
    views: "89K views",
    timestamp: "5 days ago",
    duration: "22:15",
  },
  {
    id: "3",
    title: "Top 10 JavaScript Frameworks to Learn",
    channel: "WebDev Simplified",
    channelAvatar: "https://ui-avatars.com/api/?name=WebDev&background=2ECC71&color=fff&size=32",
    thumbnail: "https://images.unsplash.com/photo-1592609931095-54a2168ae893?w=400",
    views: "256K views",
    timestamp: "1 week ago",
    duration: "18:42",
  },
  {
    id: "4",
    title: "How to Build a Startup from Scratch",
    channel: "Entrepreneur Life",
    channelAvatar: "https://ui-avatars.com/api/?name=Entrepreneur&background=F39C12&color=fff&size=32",
    thumbnail: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400",
    views: "45K views",
    timestamp: "3 days ago",
    duration: "32:10",
  },
  {
    id: "5",
    title: "Mastering React Server Components",
    channel: "React University",
    channelAvatar: "https://ui-avatars.com/api/?name=React&background=9B59B6&color=fff&size=32",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400",
    views: "312K views",
    timestamp: "4 days ago",
    duration: "28:33",
  },
  {
    id: "6",
    title: "Amazing Nature Documentary",
    channel: "Nature Channel",
    channelAvatar: "https://ui-avatars.com/api/?name=Nature&background=1ABC9C&color=fff&size=32",
    thumbnail: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400",
    views: "1.2M views",
    timestamp: "2 weeks ago",
    duration: "45:00",
  },
];

const VideoGrid = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setVideos(sampleVideos);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return <VideoGridSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {videos.map((video) => (
        <Link key={video.id} href={`/watch/${video.id}`} className="group">
          <div className="flex flex-col gap-2">
            <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
              <Image
                src={video.thumbnail}
                alt={video.title}
                fill
                className="object-cover group-hover:scale-105 transition duration-300"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                {video.duration}
              </span>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <Image
                  src={video.channelAvatar}
                  alt={video.channel}
                  width={36}
                  height={36}
                  className="rounded-full object-cover"
                  style={{ width: "36px", height: "36px" }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold line-clamp-2 text-sm group-hover:text-blue-600">
                  {video.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
                  {video.channel}
                </p>
                <div className="flex gap-1 text-sm text-gray-600">
                  <span>{video.views}</span>
                  <span>•</span>
                  <span>{video.timestamp}</span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

// Import the skeleton
import VideoGridSkeleton from "./video-grid-skeleton";

export default VideoGrid;