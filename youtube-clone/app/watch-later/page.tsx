"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, Trash2 } from "lucide-react";
import { getBackendUrl, getImageUrl } from "@/lib/utils";

interface WatchLaterVideo {
  _id: string;
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: string;
  views: string;
  timestamp: string;
}

export default function WatchLaterPage() {
  const BACKEND_URL = getBackendUrl();
  const [videos, setVideos] = useState<WatchLaterVideo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWatchLater = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setLoading(false);
      return;
    }
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/watchlater/${userId}`);
      const data = await res.json();
      setVideos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching watch later:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchLater();
  }, []);

  const removeFromWatchLater = async (id: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/watchlater/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setVideos(videos.filter(v => v._id !== id));
      }
    } catch (error) {
      console.error("Error removing from watch later:", error);
    }
  };

  const clearAll = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    
    if (confirm("Remove all videos from Watch Later?")) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/watchlater/clear/${userId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setVideos([]);
        }
      } catch (error) {
        console.error("Error clearing watch later:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-40 h-24 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Watch later</h1>
              <p className="text-sm text-gray-500">{videos.length} videos</p>
            </div>
          </div>
          {videos.length > 0 && (
            <button
              onClick={clearAll}
              className="px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-full transition"
            >
              Clear all
            </button>
          )}
        </div>

        {videos.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Watch later is empty</h2>
            <p className="text-gray-500 mb-6">Videos you save for later will appear here</p>
            <Link href="/" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition">
              Browse videos
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {videos.map((video) => (
              <div key={video._id} className="flex gap-4 group relative">
                <Link href={`/watch/${video.videoId}`} className="flex gap-4 flex-1">
                  <div className="relative w-40 flex-shrink-0">
                    <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={getImageUrl(video.thumbnail)}
                        alt={video.title}
                        className="object-cover w-full h-full group-hover:scale-105 transition"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400";
                        }}
                      />
                    </div>
                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                      {video.duration}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base hover:text-blue-600 line-clamp-2">{video.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{video.channel}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{video.views}</span>
                      <span>•</span>
                      <span>{video.timestamp}</span>
                    </div>
                  </div>
                </Link>
                <button onClick={() => removeFromWatchLater(video._id)} className="opacity-0 group-hover:opacity-100 p-2 hover:bg-gray-100 rounded-full transition">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}