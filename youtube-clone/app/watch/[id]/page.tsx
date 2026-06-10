"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown, Share2, MoreHorizontal, Check, Clock, CheckCheck } from "lucide-react";
import Comments from "@/components/comments";
import { getBackendUrl, getVideoUrl } from "@/lib/utils";

const getAvatarColor = (name: string) => {
  if (!name) return '3498DB';
  const colors = ['E74C3C', '3498DB', '2ECC71', 'F39C12', '9B59B6', '1ABC9C', 'E67E22', '34495E'];
  const index = name.length % colors.length;
  return colors[index];
};

const getInitials = (name: string) => {
  if (!name) return 'U';
  return name.charAt(0).toUpperCase();
};

const getAvatarUrl = (name: string, size: number = 40) => {
  const displayName = name || 'User';
  const color = getAvatarColor(displayName);
  const initial = getInitials(displayName);
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'%3E%3Ccircle cx='${size/2}' cy='${size/2}' r='${size/2}' fill='%23${color}'/%3E%3Ctext x='${size/2}' y='${size/2 + size/6}' text-anchor='middle' fill='white' font-size='${size/2.5}' font-weight='bold'%3E${initial}%3C/text%3E%3C/svg%3E`;
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'Recently';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (error) {
    return 'Recently';
  }
};

export default function WatchPage() {
  const params = useParams();
  const videoId = params.id as string;
  const BACKEND_URL = getBackendUrl();
  const [video, setVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [likesCount, setLikesCount] = useState(0);
  const [dislikesCount, setDislikesCount] = useState(0);
  const [userLiked, setUserLiked] = useState(false);
  const [userDisliked, setUserDisliked] = useState(false);
  
  // Watch Later state
  const [isInWatchLater, setIsInWatchLater] = useState(false);
  const [watchLaterId, setWatchLaterId] = useState(null);
  
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);



  // Check if video is in watch later (from MongoDB)
  const checkWatchLater = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/watchlater/check/${userId}/${videoId}`);
      const data = await res.json();
      setIsInWatchLater(data.isInWatchLater);
      setWatchLaterId(data.id);
    } catch (error) {
      console.error("Error checking watch later:", error);
    }
  };

  // Add to Watch Later (MongoDB)
  const handleAddToWatchLater = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      alert("Please login to add to watch later");
      return;
    }
    
    try {
      if (isInWatchLater) {
        // Remove from watch later
        const res = await fetch(`${BACKEND_URL}/api/watchlater/user/${userId}/video/${videoId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setIsInWatchLater(false);
          setWatchLaterId(null);
          alert("Removed from Watch Later");
        }
      } else {
        // Add to watch later
        const videoData = {
          userId,
          videoId,
          title: video?.title || "Building a YouTube Clone",
          channel: video?.channel || "CodeMaster",
          thumbnail: video?.thumbnail || "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400",
          duration: video?.duration || "45:30",
          views: video?.views || "124K views",
          timestamp: new Date().toLocaleDateString(),
        };
        
        const res = await fetch(`${BACKEND_URL}/api/watchlater`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(videoData),
        });
        
        if (res.ok) {
          setIsInWatchLater(true);
          alert("Added to Watch Later");
        }
      }
    } catch (error) {
      console.error("Error updating watch later:", error);
      alert("Failed to update watch later");
    }
  };

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/videos/${videoId}`);
        const data = await res.json();
        setVideo(data);
      } catch (error) {
        console.error("Error fetching video:", error);
      } finally {
        setLoading(false);
      }
    };
    if (videoId) fetchVideo();
  }, [videoId]);

  const fetchLikeStatus = async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) return;
      
      const res = await fetch(`${BACKEND_URL}/api/videos/like-status/${videoId}?userId=${userId}`);
      const data = await res.json();
      setLikesCount(data.likesCount || 0);
      setDislikesCount(data.dislikesCount || 0);
      setUserLiked(data.liked || false);
      setUserDisliked(data.disliked || false);
    } catch (error) {
      console.error("Error fetching like status:", error);
    }
  };

  useEffect(() => {
    if (videoId) {
      fetchLikeStatus();
      checkWatchLater();
    }
  }, [videoId]);

  const handleLike = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      alert("Please login to like");
      return;
    }
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/videos/like/${videoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      setUserLiked(data.liked);
      if (data.liked) setUserDisliked(false);
      setLikesCount(data.likesCount);
      setDislikesCount(data.dislikesCount);
    } catch (error) {
      console.error("Error liking:", error);
    }
  };

  const handleDislike = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      alert("Please login to dislike");
      return;
    }
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/videos/dislike/${videoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      setUserDisliked(data.disliked);
      if (data.disliked) setUserLiked(false);
      setLikesCount(data.likesCount);
      setDislikesCount(data.dislikesCount);
    } catch (error) {
      console.error("Error disliking:", error);
    }
  };

  // Handlers for comments removed (delegated to Comments component)

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowShareMenu(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <div className="max-w-[1800px] mx-auto px-4 py-6">
          <div className="animate-pulse">
            <div className="aspect-video bg-gray-200 dark:bg-gray-800 rounded-xl mb-4"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-2"></div>
          </div>
        </div>
      </div>
    );
  }



  if (!video) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl font-bold">Video not found</h1>
      </div>
    );
  }

  let videoUrl = getVideoUrl(video.videoUrl);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-[1800px] mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
              {videoUrl?.includes("youtube.com") ? (
                <iframe 
                  src={videoUrl}
                  title={video.title} 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  referrerPolicy="strict-origin-when-cross-origin" 
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full"
                />
              ) : (
                <video src={videoUrl} className="w-full h-full" controls autoPlay />
              )}
            </div>
            <h1 className="text-xl md:text-2xl font-bold mt-4">{video.title}</h1>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <img src={getAvatarUrl("Channel", 48)} alt="Channel" className="w-12 h-12 rounded-full" />
                  <div>
                    <h3 className="font-semibold text-base">Channel Name</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">1.2M subscribers</p>
                  </div>
                </div>
                <button className="px-4 py-1.5 bg-black text-white rounded-full text-sm font-semibold">Subscribe</button>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={handleLike} 
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition ${
                    userLiked ? "bg-blue-100 text-blue-600" : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  <ThumbsUp className="w-5 h-5" />
                  <span>{likesCount}</span>
                </button>
                <button 
                  onClick={handleDislike} 
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition ${
                    userDisliked ? "bg-red-100 text-red-600" : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  <ThumbsDown className="w-5 h-5" />
                  <span>{dislikesCount}</span>
                </button>
                
                <button 
                  onClick={handleAddToWatchLater}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition ${
                    isInWatchLater
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  {isInWatchLater ? <CheckCheck className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  <span className="hidden sm:inline">{isInWatchLater ? "Added" : "Watch later"}</span>
                </button>
                
                <button className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200">
                  <Share2 className="w-5 h-5" />
                  <span className="hidden sm:inline">Share</span>
                </button>
              </div>
            </div>

            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800/50 rounded-xl">
              <div className="flex gap-3 text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>{video.views || 0} views</span>
                <span>•</span>
                <span>{formatDate(video.createdAt)}</span>
              </div>
              <p className="text-sm">{video.description}</p>
            </div>

            <Comments videoId={videoId} />
          </div>
        </div>
      </div>
    </div>
  );
}