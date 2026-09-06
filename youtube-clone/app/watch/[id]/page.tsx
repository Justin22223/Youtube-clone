"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown, Share2, MoreHorizontal, Check, Clock, CheckCheck, Download } from "lucide-react";
import Comments from "@/components/comments";
import PremiumDialog from "@/components/premium-dialog";
import VideoPlayer from "@/components/video-player";
import { getBackendUrl, getVideoUrl } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";

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
  
  const { dbUser } = useAuth() as any;
  const [watchSeconds, setWatchSeconds] = useState(0);
  const [videoBlocked, setVideoBlocked] = useState(false);
  
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
    const userId = localStorage.getItem("currentUserId") || localStorage.getItem("userId");
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
    const userId = localStorage.getItem("currentUserId") || localStorage.getItem("userId");
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
        const res = await fetch(`${BACKEND_URL}/api/videos/video/${videoId}`);
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

  // Record video in watch history
  useEffect(() => {
    if (video && !loading) {
      try {
        const savedHistory = localStorage.getItem("watchHistory");
        let history = [];
        if (savedHistory) {
          try {
            history = JSON.parse(savedHistory);
            if (!Array.isArray(history)) history = [];
          } catch (e) {
            history = [];
          }
        }
        
        const videoIdToSave = video._id || video.id || videoId;
        
        // Remove if already exists to put it at the top
        history = history.filter((item: any) => item.id !== videoIdToSave);
        
        const newHistoryItem = {
          id: videoIdToSave,
          title: video.title || "Unknown Title",
          channel: video.channel || "Channel Name",
          channelAvatar: getAvatarUrl(video.channel || "Channel", 48),
          thumbnail: video.thumbnail || "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400",
          views: video.views ? `${video.views} views` : "0 views",
          timestamp: formatDate(video.createdAt),
          watchedAt: new Date().toISOString(),
          duration: video.duration || "10:00",
        };
        
        history.unshift(newHistoryItem);
        localStorage.setItem("watchHistory", JSON.stringify(history));
      } catch (error) {
        console.error("Error saving to watch history:", error);
      }
    }
  }, [video, loading, videoId]);

  useEffect(() => {
    if (loading || !video || videoBlocked) return;
    
    let limit = 300; // Free (5 mins)
    if (dbUser?.plan === "Bronze") limit = 420; // 7 mins
    else if (dbUser?.plan === "Silver") limit = 600; // 10 mins
    else if (dbUser?.plan === "Gold" || dbUser?.isPremium) limit = Infinity;
    
    if (limit === Infinity) return;

    const timer = setInterval(() => {
      setWatchSeconds(prev => {
        if (prev >= limit) {
          clearInterval(timer);
          setVideoBlocked(true);
          setShowPremiumDialog(true);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [dbUser, loading, video, videoBlocked]);

  const fetchLikeStatus = async () => {
    try {
      const userId = localStorage.getItem("currentUserId") || localStorage.getItem("userId");
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
    const userId = localStorage.getItem("currentUserId") || localStorage.getItem("userId");
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
    const userId = localStorage.getItem("currentUserId") || localStorage.getItem("userId");
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

  const [showPremiumDialog, setShowPremiumDialog] = useState(false);

  const handleDownload = async () => {
    const userId = localStorage.getItem("currentUserId") || localStorage.getItem("userId");
    if (!userId) {
      alert("Please login to download videos");
      return;
    }
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/download/${videoId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      
      if (res.ok) {
        alert("Downloading... Saved to Profile Downloads");
        
        // Trigger actual physical download of the file
        try {
          const videoUrlToDownload = video.videoUrl;
          if (videoUrlToDownload) {
             const a = document.createElement("a");
             a.href = videoUrlToDownload;
             a.download = `${video.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp4`;
             a.target = "_blank";
             document.body.appendChild(a);
             a.click();
             document.body.removeChild(a);
          }
        } catch (downloadErr) {
          console.error("Failed to physically download:", downloadErr);
        }
      } else if (res.status === 403 && data.requiresPremium) {
        setShowPremiumDialog(true);
      } else {
        alert(data.message || "Failed to download");
      }
    } catch (error) {
      alert("Error tracking download");
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
      <div className="max-w-[1800px] mx-auto px-0 md:px-4 py-0 md:py-6">
        <div className="flex flex-col xl:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <div className="relative w-full aspect-video bg-black md:rounded-xl overflow-hidden shadow-lg">
              {videoBlocked ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white z-10 text-center px-4">
                  <Clock className="w-16 h-16 text-yellow-500 mb-4" />
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">Watch Limit Reached</h2>
                  <p className="text-gray-300 mb-6">You have reached the watch limit for your current plan. Upgrade to keep watching!</p>
                  <button 
                    onClick={() => setShowPremiumDialog(true)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-full font-bold transition text-lg shadow-lg"
                  >
                    View Premium Plans
                  </button>
                </div>
              ) : (
                <VideoPlayer 
                  videoUrl={videoUrl || ""} 
                  title={video.title}
                  onOpenComments={() => {
                    document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  onNextVideo={() => {
                    window.location.href = '/';
                  }}
                />
              )}
            </div>
            <div className="px-4 md:px-0">
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
                    userLiked ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400" : "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <ThumbsUp className="w-5 h-5" />
                  <span>{likesCount}</span>
                </button>
                <button 
                  onClick={handleDislike} 
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition ${
                    userDisliked ? "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400" : "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <ThumbsDown className="w-5 h-5" />
                  <span>{dislikesCount}</span>
                </button>
                
                <button 
                  onClick={handleAddToWatchLater}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition ${
                    isInWatchLater
                      ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
                      : "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {isInWatchLater ? <CheckCheck className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  <span className="hidden sm:inline">{isInWatchLater ? "Added" : "Watch later"}</span>
                </button>
                
                <button 
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full transition bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                >
                  <Download className="w-5 h-5" />
                  <span className="hidden sm:inline">Download</span>
                </button>
                
                <button className="flex items-center gap-2 px-4 py-1.5 rounded-full transition bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">
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

            <div id="comments-section" className="pt-4">
              <Comments videoId={videoId} />
            </div>
            </div>
          </div>
        </div>
      </div>
      
      {showPremiumDialog && (
        <PremiumDialog
          isOpen={showPremiumDialog}
          onClose={() => setShowPremiumDialog(false)}
          onSuccess={() => {
            alert("Payment successful! You are now a Premium user with unlimited downloads.");
          }}
        />
      )}
    </div>
  );
}