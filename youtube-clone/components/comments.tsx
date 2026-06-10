"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ThumbsUp, ThumbsDown, Reply, Languages, MapPin, AlertCircle, HelpCircle, Trash2 } from "lucide-react";
import axiosInstance from "../lib/axiosinstance";
import { useAuth } from "../lib/AuthContext";

interface Comment {
  _id: string;
  id?: string;
  userId: string;
  username: string;
  userAvatar: string;
  city?: string;
  text: string;
  likes: string[];
  dislikes: string[];
  createdAt: string;
  replies?: Comment[];
}

interface CommentsProps {
  videoId: string;
  commentCount?: number;
}

const specialCharsRegex = /[@#$%^&*<>{}[\]|\\~]/;

const LANGUAGES_LIST = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "hi", name: "Hindi" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ar", name: "Arabic" },
  { code: "ru", name: "Russian" },
  { code: "pt", name: "Portuguese" },
  { code: "it", name: "Italian" },
  { code: "tr", name: "Turkish" },
  { code: "nl", name: "Dutch" },
  { code: "sv", name: "Swedish" },
];

// Helper to fetch user's city with multiple API fallbacks
const fetchWithTimeout = async (url: string, timeoutMs = 3000): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
};

const getUserCityWithFallbacks = async (): Promise<string> => {
  const apis = [
    "https://ipwho.is/",
    "https://ipapi.co/json/",
    "https://ipinfo.io/json",
  ];

  for (const url of apis) {
    try {
      const res = await fetchWithTimeout(url);
      if (res.ok) {
        const data = await res.json();
        if (data?.city) return data.city;
      }
    } catch {
      // Silently try next API
    }
  }

  return "Unknown City";
};

// Top-level CommentItem component to prevent re-rendering issues
interface CommentItemProps {
  comment: Comment;
  isReply?: boolean;
  videoId: string;
  user: any;
  dbUser: any;
  userCity: string;
  handleRemoveComment: (id: string) => void;
  setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
}

const CommentItem = ({
  comment,
  isReply = false,
  videoId,
  user,
  dbUser,
  userCity,
  handleRemoveComment,
  setComments,
}: CommentItemProps) => {
  const currentUserId = user?.uid || "";
  const commentId = comment._id || comment.id;

  const initialLiked = Array.isArray(comment.likes) && comment.likes.includes(currentUserId);
  const initialDisliked = Array.isArray(comment.dislikes) && comment.dislikes.includes(currentUserId);

  const [liked, setLiked] = useState(initialLiked);
  const [disliked, setDisliked] = useState(initialDisliked);
  const [likesCount, setLikesCount] = useState(Array.isArray(comment.likes) ? comment.likes.length : 0);
  const [dislikesCount, setDislikesCount] = useState(Array.isArray(comment.dislikes) ? comment.dislikes.length : 0);

  const [isTranslated, setIsTranslated] = useState(false);
  const [translatedText, setTranslatedText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState("");
  const [targetLang, setTargetLang] = useState("en");
  const [translationsCache, setTranslationsCache] = useState<Record<string, string>>({});

  const [showReplyInput, setShowReplyInput] = useState(false);
  const [localReplyText, setLocalReplyText] = useState("");
  const [replyError, setReplyError] = useState("");
  const [showLocalReplies, setShowLocalReplies] = useState(false);

  // Synchronize internal states if comment prop changes
  useEffect(() => {
    setLiked(Array.isArray(comment.likes) && comment.likes.includes(currentUserId));
    setDisliked(Array.isArray(comment.dislikes) && comment.dislikes.includes(currentUserId));
    setLikesCount(Array.isArray(comment.likes) ? comment.likes.length : 0);
    setDislikesCount(Array.isArray(comment.dislikes) ? comment.dislikes.length : 0);
  }, [comment, currentUserId]);

  const handleReplyChange = (text: string) => {
    setLocalReplyText(text);
    if (specialCharsRegex.test(text)) {
      setReplyError("Disallowed special characters: @ # $ % ^ & * < > { } [ ] \\ | ~");
    } else {
      setReplyError("");
    }
  };

  const handleLocalReply = async () => {
    if (!localReplyText.trim()) return;
    if (!user) {
      alert("You must be logged in to reply.");
      return;
    }
    if (specialCharsRegex.test(localReplyText)) {
      setReplyError("Disallowed special characters in reply text.");
      return;
    }

    try {
      const res = await axiosInstance.post("/api/comments", {
        videoId,
        userId: user.uid,
        username: dbUser?.username || user.displayName || "User",
        userAvatar: dbUser?.avatar || user.photoURL || "",
        city: userCity,
        text: localReplyText,
        parentCommentId: commentId,
      });

      const newReply = res.data;

      setComments((prevComments) =>
        prevComments.map((c) => {
          if (c._id === commentId || c.id === commentId) {
            return { ...c, replies: [...(c.replies || []), newReply] };
          }
          return c;
        })
      );
      setLocalReplyText("");
      setShowReplyInput(false);
      setShowLocalReplies(true);
    } catch (error: any) {
      console.error("Error replying:", error);
      alert(error.response?.data?.message || "Error adding reply");
    }
  };

  const handleDislike = async () => {
    if (!user) {
      alert("You must be logged in to dislike.");
      return;
    }
    try {
      const res = await axiosInstance.put(`/api/comments/dislike/${commentId}`, { userId: user.uid });
      if (res.data.removed) {
        handleRemoveComment(commentId as string);
        return;
      }

      if (disliked) {
        setDisliked(false);
        setDislikesCount((prev) => prev - 1);
      } else {
        setDisliked(true);
        setDislikesCount((prev) => prev + 1);
        if (liked) {
          setLiked(false);
          setLikesCount((prev) => prev - 1);
        }
      }
    } catch (error) {
      console.error("Error disliking comment:", error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      alert("You must be logged in to like.");
      return;
    }
    try {
      await axiosInstance.put(`/api/comments/like/${commentId}`, { userId: user.uid });
      if (liked) {
        setLiked(false);
        setLikesCount((prev) => prev - 1);
      } else {
        setLiked(true);
        setLikesCount((prev) => prev + 1);
        if (disliked) {
          setDisliked(false);
          setDislikesCount((prev) => prev - 1);
        }
      }
    } catch (error) {
      console.error("Error liking comment:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    try {
      await axiosInstance.delete(`/api/comments/${commentId}`);
      handleRemoveComment(commentId as string);
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Failed to delete comment");
    }
  };

  const triggerTranslation = async (langCode: string) => {
    if (translationsCache[langCode]) {
      setTranslatedText(translationsCache[langCode]);
      setIsTranslated(true);
      return;
    }

    setIsTranslating(true);
    setTranslationError("");
    try {
      let googleTranslation = "";
      let detectedLang = "en";

      // 1. Detect language using the free, keyless Google Translate client endpoint
      try {
        const detectRes = await fetch(
          `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t&q=${encodeURIComponent(comment.text)}`
        );
        if (detectRes.ok) {
          const detectData = await detectRes.json();
          if (detectData) {
            if (detectData[2]) {
              detectedLang = detectData[2];
            }
            if (detectData[0]) {
              googleTranslation = detectData[0].map((x: any) => x[0]).join("");
            }
          }
        }
      } catch (err) {
        console.warn("Language detection failed, falling back to 'en'", err);
      }

      // If detected source language is the same as the target language, show original text
      if (detectedLang === langCode) {
        setTranslatedText(comment.text);
        setIsTranslated(true);
        return;
      }

      // 2. Fetch translation from MyMemory using the detected 2-letter ISO language code (never passes "auto")
      try {
        const res = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(comment.text)}&langpair=${detectedLang}|${langCode}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data && data.responseData && data.responseData.translatedText) {
            const text = data.responseData.translatedText;
            setTranslationsCache((prev) => ({ ...prev, [langCode]: text }));
            setTranslatedText(text);
            setIsTranslated(true);
            return;
          }
        }
        throw new Error("MyMemory translation returned invalid status");
      } catch (error) {
        console.warn("MyMemory translation failed, falling back to Google Translate response", error);
        if (googleTranslation) {
          setTranslationsCache((prev) => ({ ...prev, [langCode]: googleTranslation }));
          setTranslatedText(googleTranslation);
          setIsTranslated(true);
        } else {
          setTranslationError("Translation service failed.");
        }
      }
    } catch (error) {
      console.error("General translation flow failed:", error);
      setTranslationError("Translation service failed.");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleTranslateToggle = () => {
    if (isTranslated) {
      setIsTranslated(false);
    } else {
      triggerTranslation(targetLang);
    }
  };

  const displayedText = isTranslated ? translatedText : comment.text;
  const formattedDate = comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : "Just now";

  return (
    <div className={`flex gap-3 hover:bg-gray-50/50 dark:hover:bg-gray-905/30 p-2.5 rounded-xl transition ${isReply ? "ml-10 mt-2.5" : "mt-3"}`}>
      <Image
        src={comment.userAvatar || "https://ui-avatars.com/api/?name=User&background=random&color=fff&size=40"}
        alt={comment.username || "User"}
        width={isReply ? 32 : 40}
        height={isReply ? 32 : 40}
        className="rounded-full object-cover flex-shrink-0 border border-gray-100 dark:border-gray-800"
        style={{ width: isReply ? "32px" : "40px", height: isReply ? "32px" : "40px" }}
      />
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{comment.username || "User"}</span>
          {comment.city && comment.city !== "Unknown City" && (
            <span className="text-[11px] font-medium bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border border-rose-100 dark:border-rose-900/30">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span>{comment.city}</span>
            </span>
          )}
          <span className="text-xs text-gray-400">{formattedDate}</span>
        </div>

        {isTranslating ? (
          <p className="text-sm text-gray-400 italic animate-pulse">Translating comment...</p>
        ) : (
          <div className="text-sm text-gray-800 dark:text-gray-200">
            <p className="leading-relaxed whitespace-pre-wrap">{displayedText}</p>
            {isTranslated && (
              <span className="text-[10px] font-medium bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 px-1.5 py-0.5 rounded mt-1.5 inline-block border border-indigo-100 dark:border-indigo-900/30 animate-fadeIn">
                Translated to {LANGUAGES_LIST.find((l) => l.code === targetLang)?.name || "English"} via MyMemory
              </span>
            )}
          </div>
        )}

        {translationError && (
          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {translationError}
          </p>
        )}

        <div className="flex items-center gap-4 mt-2.5">
          <button 
            onClick={handleLike} 
            className={`flex items-center gap-1.5 text-xs font-medium p-1 rounded-md hover:bg-gray-105 dark:hover:bg-gray-800/80 transition ${
              liked ? "text-indigo-600 dark:text-indigo-400 font-semibold" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            <ThumbsUp className={`w-3.5 h-3.5 transition-transform ${liked ? "scale-110" : ""}`} />
            <span>{likesCount}</span>
          </button>
          <button 
            onClick={handleDislike} 
            className={`flex items-center gap-1.5 text-xs font-medium p-1 rounded-md hover:bg-gray-105 dark:hover:bg-gray-800/80 transition ${
              disliked ? "text-rose-600 dark:text-rose-400 font-semibold" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            <ThumbsDown className={`w-3.5 h-3.5 transition-transform ${disliked ? "scale-110" : ""}`} />
            <span>{dislikesCount}</span>
          </button>
          <div className="flex items-center gap-1">
            <button 
              onClick={handleTranslateToggle} 
              disabled={isTranslating} 
              className={`flex items-center gap-1.5 text-xs font-medium p-1 rounded-md hover:bg-gray-105 dark:hover:bg-gray-800/80 transition ${
                isTranslated ? "text-indigo-600 dark:text-indigo-400 font-semibold" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
              <Languages className="w-3.5 h-3.5" />
              <span>{isTranslated ? "Show original" : "Translate"}</span>
            </button>
            <select
              value={targetLang}
              onChange={(e) => {
                const lang = e.target.value;
                setTargetLang(lang);
                triggerTranslation(lang);
              }}
              disabled={isTranslating}
              className="bg-transparent text-[11px] text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 border-none cursor-pointer focus:outline-none py-0.5 px-1 rounded hover:bg-gray-105 dark:hover:bg-gray-800/80 transition"
            >
              {LANGUAGES_LIST.map((l) => (
                <option key={l.code} value={l.code} className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
                  to {l.name}
                </option>
              ))}
            </select>
          </div>
          <button 
            onClick={() => setShowReplyInput(!showReplyInput)} 
            className="flex items-center gap-1.5 text-xs font-medium p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-105 dark:hover:bg-gray-800/80 transition"
          >
            <Reply className="w-3.5 h-3.5" />
            <span>Reply</span>
          </button>
          {comment.userId === currentUserId && (
            <button 
              onClick={handleDelete}
              className="flex items-center gap-1.5 text-xs font-medium p-1 rounded-md text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition ml-auto"
              title="Delete comment"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          )}
        </div>

        {showReplyInput && (
          <div className="flex gap-2.5 mt-3 p-3 bg-gray-50/70 dark:bg-gray-800/20 rounded-xl border border-gray-100 dark:border-gray-800/30">
            <Image
              src={dbUser?.avatar || user?.photoURL || "https://ui-avatars.com/api/?name=User"}
              alt="Current user"
              width={28} height={28}
              className="rounded-full flex-shrink-0"
              style={{ width: "28px", height: "28px" }}
            />
            <div className="flex-1">
              <input 
                type="text" 
                value={localReplyText} 
                onChange={(e) => handleReplyChange(e.target.value)} 
                placeholder={`Reply to ${comment.username || "User"}...`} 
                className={`w-full px-2 py-1.5 border-b bg-transparent focus:outline-none transition-colors text-sm ${
                  replyError ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-blue-500 dark:border-gray-700"
                }`} 
                onKeyPress={(e) => e.key === "Enter" && handleLocalReply()} 
              />
              {replyError && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1 animate-pulse">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" /> {replyError}
                </p>
              )}
              <div className="flex gap-2 mt-2.5">
                <button 
                  onClick={handleLocalReply} 
                  disabled={!localReplyText.trim() || !!replyError} 
                  className="px-3.5 py-1 bg-indigo-600 text-white rounded-full text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  Reply
                </button>
                <button 
                  onClick={() => { setShowReplyInput(false); setReplyError(""); }} 
                  className="px-3.5 py-1 bg-gray-205 text-gray-700 dark:bg-gray-800 dark:text-gray-200 rounded-full text-xs font-semibold hover:bg-gray-300 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 border-l-2 border-gray-100 dark:border-gray-800/80 ml-2 pl-2">
            <button 
              onClick={() => setShowLocalReplies(!showLocalReplies)} 
              className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold flex items-center gap-1 transition p-1 rounded hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20"
            >
              {showLocalReplies ? "Hide replies" : `View ${comment.replies.length} replies`}
            </button>
            {showLocalReplies && comment.replies.map((reply) => (
              <CommentItem 
                key={reply._id || reply.id} 
                comment={reply} 
                isReply 
                videoId={videoId}
                user={user}
                dbUser={dbUser}
                userCity={userCity}
                handleRemoveComment={handleRemoveComment}
                setComments={setComments}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Comments = ({ videoId, commentCount = 0 }: CommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [newCommentError, setNewCommentError] = useState("");
  const [sortBy, setSortBy] = useState<"top" | "newest">("top");
  const [isLoading, setIsLoading] = useState(true);
  const [userCity, setUserCity] = useState("Unknown City");

  const { user, dbUser } = useAuth();

  useEffect(() => {
    const fetchCity = async () => {
      const city = await getUserCityWithFallbacks();
      setUserCity(city);
    };
    fetchCity();
  }, []);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get(`/api/comments/${videoId}`);
      setComments(res.data);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (videoId) {
      fetchComments();
    }
  }, [videoId]);

  const handleCommentChange = (text: string) => {
    setNewComment(text);
    if (specialCharsRegex.test(text)) {
      setNewCommentError("Disallowed special characters: @ # $ % ^ & * < > { } [ ] \\ | ~");
    } else {
      setNewCommentError("");
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    if (!user) {
      alert("You must be logged in to comment.");
      return;
    }
    if (specialCharsRegex.test(newComment)) {
      setNewCommentError("Comment contains disallowed special characters.");
      return;
    }

    try {
      const res = await axiosInstance.post("/api/comments", {
        videoId,
        userId: user.uid,
        username: dbUser?.username || user.displayName || "User",
        userAvatar: dbUser?.avatar || user.photoURL || "",
        city: userCity,
        text: newComment,
      });
      setComments([{ ...res.data, replies: [] }, ...comments]);
      setNewComment("");
      setNewCommentError("");
    } catch (error: any) {
      console.error("Error adding comment:", error);
      alert(error.response?.data?.message || "Error adding comment");
    }
  };

  const handleRemoveComment = (id: string) => {
    setComments((prevComments) => {
      return prevComments
        .filter((c) => c._id !== id && c.id !== id)
        .map((c) => ({
          ...c,
          replies: c.replies?.filter((r) => r._id !== id && r.id !== id),
        }));
    });
  };

  const sortedComments = [...comments].sort((a, b) => {
    const aLikes = a.likes?.length || 0;
    const bLikes = b.likes?.length || 0;
    if (sortBy === "top") return bLikes - aLikes;
    return new Date(b.createdAt || Date.now()).getTime() - new Date(a.createdAt || Date.now()).getTime();
  });

  return (
    <div className="mt-8 font-sans">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
            Comments ({comments.length + comments.reduce((acc, c) => acc + (c.replies?.length || 0), 0)})
          </h3>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as "top" | "newest")} 
            className="bg-transparent text-sm border border-gray-200 dark:border-gray-800 rounded-full px-3 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-gray-650 dark:text-gray-305"
          >
            <option value="top">Top comments</option>
            <option value="newest">Newest first</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3.5 mb-8 bg-gray-50/50 dark:bg-gray-900/10 p-4 rounded-2xl border border-gray-100 dark:border-gray-805/40 backdrop-blur-sm">
        <Image
          src={dbUser?.avatar || user?.photoURL || "https://ui-avatars.com/api/?name=User&background=random&color=fff&size=40"}
          alt="Current user"
          width={40} height={40}
          className="rounded-full flex-shrink-0 border border-gray-200 dark:border-gray-800"
          style={{ width: "40px", height: "40px" }}
        />
        <div className="flex-1">
          <input 
            type="text" 
            value={newComment} 
            onChange={(e) => handleCommentChange(e.target.value)} 
            placeholder="Add a comment..." 
            className={`w-full px-1 py-2 border-b bg-transparent focus:outline-none transition-colors text-sm md:text-base ${
              newCommentError ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-indigo-500 dark:border-gray-800"
            }`} 
            onKeyPress={(e) => e.key === "Enter" && handleAddComment()} 
          />
          {newCommentError && (
            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1 animate-pulse">
              <AlertCircle className="w-3.5 h-3.5" /> {newCommentError}
            </p>
          )}
          <div className="flex justify-end gap-2 mt-3.5">
            <button 
              onClick={() => { setNewComment(""); setNewCommentError(""); }} 
              className="px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold hover:bg-gray-150 dark:hover:bg-gray-800 transition"
            >
              Cancel
            </button>
            <button 
              onClick={handleAddComment} 
              disabled={!newComment.trim() || !!newCommentError || !user} 
              className="px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition shadow-sm hover:shadow"
            >
              Comment
            </button>
          </div>
          {!user && (
            <p className="text-xs text-red-500/80 mt-2 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" /> Please sign in to join the conversation.
            </p>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div className="space-y-3">
          {sortedComments.map((comment) => (
            <CommentItem 
              key={comment._id || comment.id} 
              comment={comment} 
              videoId={videoId}
              user={user}
              dbUser={dbUser}
              userCity={userCity}
              handleRemoveComment={handleRemoveComment}
              setComments={setComments}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Comments;