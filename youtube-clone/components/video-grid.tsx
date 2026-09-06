"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { getAvatarUrl, getImageUrl, getBackendUrl, getEmbedUrl } from "@/lib/utils";
import VideoGridSkeleton from "./video-grid-skeleton";

const FeaturedVideoBanner = ({ video }: { video: any }) => {
  const { url } = getEmbedUrl(video.videoUrl);
  
  return (
    <div className="relative w-full aspect-video md:aspect-[21/9] rounded-2xl overflow-hidden mb-8 group bg-black shadow-lg">
      <Link href={`/watch/${video._id}`} className="absolute inset-0 z-20" />
      {/* Autoplaying video background for local/uploaded videos */}
      <video 
        src={url || undefined} 
        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-700 pointer-events-none" 
        autoPlay 
        muted 
        loop 
        playsInline
      />
      
      {/* Overlay gradient for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full md:w-2/3 pointer-events-none z-10 flex flex-col justify-end h-full">
        <div className="flex items-center gap-3 mb-3">
          <span className="px-2.5 py-1 bg-red-600 text-white text-xs font-bold rounded uppercase tracking-wider shadow-sm">Featured</span>
          <span className="text-white/90 text-sm font-medium drop-shadow-md">{video.views || 0} views • {video.createdAt ? new Date(video.createdAt).toLocaleDateString() : "Recently"}</span>
        </div>
        <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 line-clamp-2 drop-shadow-lg">{video.title}</h2>
        <p className="text-white/80 text-sm md:text-base line-clamp-2 mb-6 max-w-2xl drop-shadow-md">{video.description || "No description available for this video."}</p>
        
        <div className="flex items-center gap-4">
          <button className="px-6 py-2.5 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition pointer-events-auto shadow-xl flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
            </svg>
            Play Now
          </button>
        </div>
      </div>
    </div>
  );
};

const VideoCard = ({ video }: { video: any }) => {
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleMouseEnter = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 400); // 400ms delay before playing
  };
  
  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHovered(false);
  };

  const { url } = getEmbedUrl(video.videoUrl);

  return (
    <Link 
      href={`/watch/${video._id}`} 
      className="group flex flex-col gap-2"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
        <img
          src={getImageUrl(video.thumbnail)}
          alt={video.title}
          className={`absolute inset-0 w-full h-full object-cover transition duration-300 ${isHovered ? 'opacity-0 scale-105' : 'opacity-100'}`}
          onError={(e) => {
            e.currentTarget.src = "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400";
          }}
        />
        
        {isHovered && (
          <div className="absolute inset-0 z-10 animate-in fade-in duration-500">
            <video 
              src={url || undefined} 
              className="w-full h-full object-cover" 
              autoPlay 
              muted 
              loop 
              playsInline
            />
          </div>
        )}
        
        <span className={`absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[12px] font-medium px-1.5 py-0.5 rounded z-20 ${isHovered ? 'opacity-0' : 'opacity-100'} transition-opacity`}>
          {video.duration || "00:00"}
        </span>
      </div>

      <div className="flex gap-3 mt-3">
        <div className="flex-shrink-0">
          <Image
            src={video.channelAvatar || getAvatarUrl("User", "3498DB")}
            alt={video.channel || "User"}
            width={36}
            height={36}
            className="rounded-full object-cover mt-0.5"
            style={{ width: "36px", height: "36px" }}
          />
        </div>

        <div className="flex-1 min-w-0 pr-6">
          <h3 className="font-medium text-base leading-snug line-clamp-2 text-black dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-1">
            {video.title}
          </h3>
          <p className="text-[14px] text-gray-600 dark:text-[#aaaaaa] mt-1 truncate hover:text-gray-900 dark:hover:text-white transition-colors">
            {video.channel || "User"}
          </p>
          <div className="flex gap-1 text-[14px] text-gray-600 dark:text-[#aaaaaa] mt-0.5">
            <span>{video.views || 0} views</span>
            <span>•</span>
            <span>{video.createdAt ? new Date(video.createdAt).toLocaleDateString() : "Recently"}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

const VideoGrid = () => {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const backendUrl = getBackendUrl();
        const res = await fetch(`${backendUrl}/api/videos/all`);
        const data = await res.json();
        setVideos(data);
      } catch (error) {
        console.error("Error fetching videos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  if (loading) {
    return <VideoGridSkeleton />;
  }
  
  if (videos.length === 0) {
    return <div className="text-center py-20 text-gray-500">No videos found.</div>;
  }

  return (
    <div className="flex flex-col w-full pb-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-x-4 gap-y-10">
        {videos.map((video) => (
          <VideoCard key={video._id} video={video} />
        ))}
      </div>
    </div>
  );
};

export default VideoGrid;