"use client";

import { useState } from "react";
import Link from "next/link";
import { Video as VideoIcon, Trash2, Search, X, AlertCircle } from "lucide-react";
import { getImageUrl } from "@/lib/utils";

interface Video {
  _id?: string;
  id?: string;
  title: string;
  thumbnail: string;
  views: number;
  createdAt: string;
  duration?: string;
}

interface ChannelVideosProps {
  channelId: string;
  isOwnChannel?: boolean;
  onVideoDelete?: (videoId: string) => void;
  maxItems?: number;
  showSearch?: boolean;
  videos?: Video[];
}

const ChannelVideos = ({ 
  isOwnChannel = false,
  onVideoDelete,
  maxItems,
  showSearch = true,
  videos = []
}: ChannelVideosProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  if (!videos || videos.length === 0) {
    return (
      <div className="text-center py-16">
        <VideoIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">No videos yet</h3>
        <p className="text-gray-500">
          {isOwnChannel ? "Upload your first video to get started" : "This channel hasn't uploaded any videos yet"}
        </p>
      </div>
    );
  }

  const filteredVideos = videos.filter((video: Video) => 
    searchQuery === "" || video.title.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, maxItems);

  if (filteredVideos.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500">No videos found matching "{searchQuery}"</p>
      </div>
    );
  }

  return (
    <div>
      {showSearch && (
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-full focus:outline-none focus:border-blue-500 text-sm"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredVideos.map((video: Video) => {
          const videoId = video._id || video.id;
          return (
            <div key={videoId} className="group relative">
              <Link href={`/watch/${videoId}`}>
                <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
                  <img 
                    src={getImageUrl(video.thumbnail)} 
                    alt={video.title} 
                    className="object-cover w-full h-full group-hover:scale-105 transition duration-300" 
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400";
                    }}
                  />
                  {video.duration && (
                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                      {video.duration}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-sm mt-2 line-clamp-2 group-hover:text-blue-600">
                  {video.title}
                </h3>
                <div className="flex gap-2 text-xs text-gray-500 mt-1">
                  <span>{video.views || 0} views</span>
                  <span>•</span>
                  <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                </div>
              </Link>
              {isOwnChannel && onVideoDelete && (
                <button
                  onClick={() => onVideoDelete(videoId!)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-black/70 hover:bg-red-600 rounded-full"
                >
                  <Trash2 className="w-3 h-3 text-white" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChannelVideos;