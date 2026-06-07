"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ThumbsUp, ThumbsDown, MoreHorizontal, Reply } from "lucide-react";

interface Comment {
  id: string;
  username: string;
  userAvatar: string;
  text: string;
  likes: number;
  dislikes: number;
  timestamp: string;
  replies?: Comment[];
}

interface CommentsProps {
  videoId: string;
  commentCount?: number;
}

const Comments = ({ videoId, commentCount = 1240 }: CommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);
  const [replyText, setReplyText] = useState("");
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({});
  const [sortBy, setSortBy] = useState<"top" | "newest">("top");
  const [isLoading, setIsLoading] = useState(true);

  const sampleComments: Comment[] = [
    {
      id: "1",
      username: "TechEnthusiast",
      userAvatar: "https://randomuser.me/api/portraits/men/1.jpg",
      text: "This is an amazing tutorial! Really helped me understand how to build a YouTube clone with Next.js. The explanation was clear and the code examples were perfect. 🔥",
      likes: 342,
      dislikes: 12,
      timestamp: "2 days ago",
      replies: [
        {
          id: "1-1",
          username: "CodeMaster",
          userAvatar: "https://randomuser.me/api/portraits/men/2.jpg",
          text: "Thanks for the kind words! Glad it helped you 😊",
          likes: 89,
          dislikes: 2,
          timestamp: "1 day ago",
          replies: []
        }
      ]
    },
    {
      id: "2",
      username: "DesignLover",
      userAvatar: "https://randomuser.me/api/portraits/women/1.jpg",
      text: "The UI looks fantastic! Love how you implemented the dark mode support.",
      likes: 156,
      dislikes: 5,
      timestamp: "3 days ago",
      replies: []
    },
    {
      id: "3",
      username: "FrontendMaster",
      userAvatar: "https://randomuser.me/api/portraits/men/3.jpg",
      text: "Great content! Keep up the good work!",
      likes: 98,
      dislikes: 8,
      timestamp: "4 days ago",
      replies: []
    }
  ];

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setComments(sampleComments);
      setIsLoading(false);
    }, 500);
  }, [videoId]);

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const newCommentObj: Comment = {
      id: Date.now().toString(),
      username: "CurrentUser",
      userAvatar: "https://randomuser.me/api/portraits/men/4.jpg",
      text: newComment,
      likes: 0,
      dislikes: 0,
      timestamp: "Just now",
      replies: []
    };
    setComments([newCommentObj, ...comments]);
    setNewComment("");
  };

  const toggleReplies = (commentId: string) => {
    setShowReplies(prev => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  const sortedComments = [...comments].sort((a, b) => {
    if (sortBy === "top") return b.likes - a.likes;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => {
    const [liked, setLiked] = useState(false);
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [localReplyText, setLocalReplyText] = useState("");

    const handleLocalReply = () => {
      if (!localReplyText.trim()) return;
      const newReply: Comment = {
        id: `${comment.id}-reply-${Date.now()}`,
        username: "CurrentUser",
        userAvatar: "https://randomuser.me/api/portraits/men/4.jpg",
        text: localReplyText,
        likes: 0,
        dislikes: 0,
        timestamp: "Just now",
        replies: []
      };
      setComments(prevComments =>
        prevComments.map(c => {
          if (c.id === comment.id) {
            return { ...c, replies: [...(c.replies || []), newReply] };
          }
          return c;
        })
      );
      setLocalReplyText("");
      setShowReplyInput(false);
    };

    return (
      <div className={`flex gap-3 ${isReply ? "ml-12 mt-3" : "mt-4"}`}>
        <Image
          src={comment.userAvatar}
          alt={comment.username}
          width={isReply ? 32 : 40}
          height={isReply ? 32 : 40}
          className="rounded-full object-cover flex-shrink-0"
          style={{ width: isReply ? "32px" : "40px", height: isReply ? "32px" : "40px" }}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">{comment.username}</span>
            <span className="text-xs text-gray-500">{comment.timestamp}</span>
          </div>
          <p className="text-sm">{comment.text}</p>
          <div className="flex items-center gap-4 mt-2">
            <button onClick={() => setLiked(!liked)} className={`flex items-center gap-1 text-xs ${liked ? "text-blue-600" : "text-gray-500"}`}>
              <ThumbsUp className="w-4 h-4" />
              <span>{comment.likes + (liked ? 1 : 0)}</span>
            </button>
            <button onClick={() => setShowReplyInput(!showReplyInput)} className="flex items-center gap-1 text-xs text-gray-500">
              <Reply className="w-4 h-4" />
              <span>Reply</span>
            </button>
          </div>
          {showReplyInput && (
            <div className="flex gap-2 mt-3">
              <Image src="https://randomuser.me/api/portraits/men/4.jpg" alt="Current user" width={32} height={32} className="rounded-full flex-shrink-0" style={{ width: "32px", height: "32px" }} />
              <div className="flex-1">
                <input type="text" value={localReplyText} onChange={(e) => setLocalReplyText(e.target.value)} placeholder={`Reply to ${comment.username}...`} className="w-full px-3 py-2 border-b bg-transparent focus:outline-none focus:border-blue-500 text-sm" onKeyPress={(e) => e.key === "Enter" && handleLocalReply()} />
                <div className="flex gap-2 mt-2">
                  <button onClick={handleLocalReply} className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs">Reply</button>
                  <button onClick={() => setShowReplyInput(false)} className="px-3 py-1 bg-gray-200 rounded-full text-xs">Cancel</button>
                </div>
              </div>
            </div>
          )}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3">
              <button onClick={() => toggleReplies(comment.id)} className="text-sm text-blue-600 font-semibold">
                {showReplies[comment.id] ? "Hide replies" : `View ${comment.replies.length} replies`}
              </button>
              {showReplies[comment.id] && comment.replies.map((reply) => <CommentItem key={reply.id} comment={reply} isReply />)}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-lg">Comments ({commentCount})</h3>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "top" | "newest")} className="bg-transparent text-sm border rounded-full px-3 py-1 cursor-pointer">
            <option value="top">Top comments</option>
            <option value="newest">Newest first</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3 mb-8">
        <Image src="https://randomuser.me/api/portraits/men/4.jpg" alt="Current user" width={40} height={40} className="rounded-full flex-shrink-0" style={{ width: "40px", height: "40px" }} />
        <div className="flex-1">
          <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..." className="w-full px-0 py-2 border-b bg-transparent focus:outline-none focus:border-blue-500" onKeyPress={(e) => e.key === "Enter" && handleAddComment()} />
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setNewComment("")} className="px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-gray-100">Cancel</button>
            <button onClick={handleAddComment} disabled={!newComment.trim()} className="px-4 py-1.5 rounded-full text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">Comment</button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1"><div className="h-4 bg-gray-200 rounded w-32 mb-2"></div><div className="h-3 bg-gray-200 rounded w-full"></div></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">{sortedComments.map((comment) => <CommentItem key={comment.id} comment={comment} />)}</div>
      )}
    </div>
  );
};

export default Comments;