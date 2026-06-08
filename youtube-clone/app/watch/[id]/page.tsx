"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown, Share2, MoreHorizontal, Check, Clock, CheckCheck } from "lucide-react";

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

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export default function WatchPage() {
  const params = useParams();
  const videoId = params.id as string;
  const [video, setVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [likesCount, setLikesCount] = useState(0);
  const [dislikesCount, setDislikesCount] = useState(0);
  const [userLiked, setUserLiked] = useState(false);
  const [userDisliked, setUserDisliked] = useState(false);
  
  // Watch Later state
  const [isInWatchLater, setIsInWatchLater] = useState(false);
  const [watchLaterId, setWatchLaterId] = useState(null);
  
  const [comments, setComments] = useState<any[]>([]);
  const [comment, setComment] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const youtubeVideoIds = ["1", "2", "3", "4", "5", "6"];
  const isYouTubeVideo = youtubeVideoIds.includes(videoId);

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
          thumbnail: isYouTubeVideo 
            ? "https://img.youtube.com/vi/1wkPMUZ9vX4/mqdefault.jpg"
            : video?.thumbnail,
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

  const loadYouTubeLikesDislikes = () => {
    const userId = localStorage.getItem("userId");
    
    const likesStorageKey = `youtube_likes_${videoId}`;
    const dislikesStorageKey = `youtube_dislikes_${videoId}`;
    
    const storedLikes = localStorage.getItem(likesStorageKey);
    const storedDislikes = localStorage.getItem(dislikesStorageKey);
    
    const likes: string[] = storedLikes ? JSON.parse(storedLikes) : [];
    const dislikes: string[] = storedDislikes ? JSON.parse(storedDislikes) : [];
    
    setLikesCount(likes.length);
    setDislikesCount(dislikes.length);
    
    if (userId) {
      setUserLiked(likes.includes(userId));
      setUserDisliked(dislikes.includes(userId));
    }
  };

  const handleYouTubeLike = () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      alert("Please login to like");
      return;
    }
    
    const storageKey = `youtube_likes_${videoId}`;
    const storedLikes = localStorage.getItem(storageKey);
    let likes: string[] = storedLikes ? JSON.parse(storedLikes) : [];
    
    if (userLiked) {
      likes = likes.filter((id: string) => id !== userId);
      setUserLiked(false);
      setLikesCount(prev => prev - 1);
    } else {
      if (!likes.includes(userId)) {
        likes.push(userId);
        setUserLiked(true);
        setLikesCount(prev => prev + 1);
        if (userDisliked) {
          handleYouTubeDislikeRemove();
        }
      }
    }
    localStorage.setItem(storageKey, JSON.stringify(likes));
  };

  const handleYouTubeDislikeRemove = () => {
    const userId = localStorage.getItem("userId");
    const storageKey = `youtube_dislikes_${videoId}`;
    const storedDislikes = localStorage.getItem(storageKey);
    let dislikes: string[] = storedDislikes ? JSON.parse(storedDislikes) : [];
    dislikes = dislikes.filter((id: string) => id !== userId);
    localStorage.setItem(storageKey, JSON.stringify(dislikes));
    setUserDisliked(false);
    setDislikesCount(prev => prev - 1);
  };

  const handleYouTubeDislike = () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      alert("Please login to dislike");
      return;
    }
    
    const storageKey = `youtube_dislikes_${videoId}`;
    const storedDislikes = localStorage.getItem(storageKey);
    let dislikes: string[] = storedDislikes ? JSON.parse(storedDislikes) : [];
    
    if (userDisliked) {
      dislikes = dislikes.filter((id: string) => id !== userId);
      setUserDisliked(false);
      setDislikesCount(prev => prev - 1);
    } else {
      if (!dislikes.includes(userId)) {
        dislikes.push(userId);
        setUserDisliked(true);
        setDislikesCount(prev => prev + 1);
        if (userLiked) {
          handleYouTubeLikeRemove();
        }
      }
    }
    localStorage.setItem(storageKey, JSON.stringify(dislikes));
  };

  const handleYouTubeLikeRemove = () => {
    const userId = localStorage.getItem("userId");
    const storageKey = `youtube_likes_${videoId}`;
    const storedLikes = localStorage.getItem(storageKey);
    let likes: string[] = storedLikes ? JSON.parse(storedLikes) : [];
    likes = likes.filter((id: string) => id !== userId);
    localStorage.setItem(storageKey, JSON.stringify(likes));
    setUserLiked(false);
    setLikesCount(prev => prev - 1);
  };

  useEffect(() => {
    if (!isYouTubeVideo) {
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
    } else {
      setLoading(false);
      loadYouTubeLikesDislikes();
      checkWatchLater();
    }
  }, [videoId, isYouTubeVideo]);

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

  const fetchComments = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/comments/${videoId}`);
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  useEffect(() => {
    if (videoId && !isYouTubeVideo) {
      fetchLikeStatus();
      fetchComments();
      checkWatchLater();
    }
  }, [videoId, isYouTubeVideo]);

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

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    
    const userId = localStorage.getItem("userId");
    const username = localStorage.getItem("username") || "User";
    
    if (!userId) {
      alert("Please login to comment");
      return;
    }
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          userId,
          username,
          text: comment,
          parentCommentId: null,
        }),
      });
      const newComment = await res.json();
      setComments([newComment, ...comments]);
      setComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    
    try {
      await fetch(`${BACKEND_URL}/api/comments/like/${commentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      fetchComments();
    } catch (error) {
      console.error("Error liking comment:", error);
    }
  };

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

  if (isYouTubeVideo) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <div className="max-w-[1800px] mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 min-w-0">
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                <iframe 
                  src="https://www.youtube.com/embed/1wkPMUZ9vX4?autoplay=1&rel=0&modestbranding=1"
                  title="YouTube video player" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  referrerPolicy="strict-origin-when-cross-origin" 
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full"
                />
              </div>
              <h1 className="text-xl md:text-2xl font-bold mt-4">Building a YouTube Clone with Next.js</h1>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <img src={getAvatarUrl("CodeMaster", 48)} alt="Channel" className="w-12 h-12 rounded-full" />
                    <div>
                      <h3 className="font-semibold text-base">CodeMaster</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">1.2M subscribers</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsSubscribed(!isSubscribed)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition flex items-center gap-1 ${
                      isSubscribed
                        ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                        : "bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800"
                    }`}
                  >
                    {isSubscribed ? <><Check className="w-4 h-4" /> Subscribed</> : "Subscribe"}
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={handleYouTubeLike} 
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition ${
                      userLiked ? "bg-blue-100 text-blue-600" : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    <ThumbsUp className="w-5 h-5" />
                    <span>{likesCount}</span>
                  </button>
                  <button 
                    onClick={handleYouTubeDislike} 
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
                  
                  <div className="relative">
                    <button onClick={() => setShowShareMenu(!showShareMenu)} className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition">
                      <Share2 className="w-5 h-5" />
                      <span className="hidden sm:inline">Share</span>
                    </button>
                    {showShareMenu && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowShareMenu(false)} />
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border z-20">
                          <button onClick={handleCopyLink} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">Copy link</button>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <button className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800/50 rounded-xl">
                <p className="text-sm">In this video, we'll build a complete YouTube clone using Next.js 15, Tailwind CSS, and shadcn/ui components.</p>
              </div>

              <div className="mt-8">
                <h3 className="font-semibold text-lg mb-4">Comments ({comments.length})</h3>
                
                <div className="flex gap-3 mb-6">
                  <img src={getAvatarUrl("You", 40)} alt="User" className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full px-0 py-2 border-b border-gray-300 bg-transparent focus:outline-none focus:border-blue-500"
                      onKeyPress={(e) => e.key === "Enter" && handleAddComment()}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button onClick={() => setComment("")} className="px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-gray-100">Cancel</button>
                      <button onClick={handleAddComment} disabled={!comment.trim()} className="px-4 py-1.5 rounded-full text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">Comment</button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {comments.map((c, index) => (
                    <div key={c._id || `comment-${index}`} className="flex gap-3">
                      <img src={c.userAvatar || getAvatarUrl(c.username, 40)} alt={c.username} className="w-10 h-10 rounded-full" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{c.username}</span>
                          <span className="text-xs text-gray-500">{formatDate(c.createdAt)}</span>
                        </div>
                        <p className="text-sm mt-1">{c.text}</p>
                        <div className="flex gap-4 mt-2">
                          <button onClick={() => handleLikeComment(c._id)} className="text-xs text-gray-500 hover:text-gray-700">
                            Like ({c.likes?.length || 0})
                          </button>
                          <button className="text-xs text-gray-500 hover:text-gray-700">Reply</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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

  let videoUrl = video.videoUrl;
  if (videoUrl && !videoUrl.startsWith('http')) {
    videoUrl = `${BACKEND_URL}${videoUrl}`;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-[1800px] mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <div className="aspect-video bg-black rounded-xl overflow-hidden">
              <video src={videoUrl} className="w-full h-full" controls autoPlay />
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

            <div className="mt-8">
              <h3 className="font-semibold text-lg mb-4">Comments ({comments.length})</h3>
              
              <div className="flex gap-3 mb-6">
                <img src={getAvatarUrl("You", 40)} alt="User" className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full px-0 py-2 border-b border-gray-300 bg-transparent focus:outline-none focus:border-blue-500"
                    onKeyPress={(e) => e.key === "Enter" && handleAddComment()}
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button onClick={() => setComment("")} className="px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-gray-100">Cancel</button>
                    <button onClick={handleAddComment} disabled={!comment.trim()} className="px-4 py-1.5 rounded-full text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">Comment</button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {comments.map((c, index) => (
                  <div key={c._id || `comment-${index}`} className="flex gap-3">
                    <img src={c.userAvatar || getAvatarUrl(c.username, 40)} alt={c.username} className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{c.username}</span>
                        <span className="text-xs text-gray-500">{formatDate(c.createdAt)}</span>
                      </div>
                      <p className="text-sm mt-1">{c.text}</p>
                      <div className="flex gap-4 mt-2">
                        <button onClick={() => handleLikeComment(c._id)} className="text-xs text-gray-500 hover:text-gray-700">
                          Like ({c.likes?.length || 0})
                        </button>
                        <button className="text-xs text-gray-500 hover:text-gray-700">Reply</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}