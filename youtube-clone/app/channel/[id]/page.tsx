"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import ChannelHeader from "@/components/channel-header";
import ChannelTab, { TabPanel } from "@/components/channel-tab";
import VideoUploader from "@/components/video-uploader";
import ChannelVideos from "@/components/channel-videos";
import { 
  Video, 
  ListVideo, 
  Users, 
  Home,
  Upload
} from "lucide-react";
import { getBackendUrl } from "@/lib/utils";

interface ChannelData {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  banner: string;
  subscribers: string;
  joinedDate: string;
  totalViews: string;
  videosCount: number;
  description?: string;
  verified?: boolean;
}

interface VideoType {
  _id: string;
  title: string;
  thumbnail: string;
  views: number;
  createdAt: string;
  duration?: string;
}

const getSampleChannelData = (id: string, cachedData?: any): ChannelData => {
  if (cachedData) {
    return {
      id: id,
      name: cachedData.name || `Channel ${id}`,
      handle: cachedData.handle || `@channel${id}`,
      avatar: cachedData.avatar || `https://ui-avatars.com/api/?name=${cachedData.name || id}&background=random&color=fff&size=128`,
      banner: cachedData.banner || "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200",
      subscribers: cachedData.subscribers?.toString() || "0",
      joinedDate: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      totalViews: cachedData.totalViews?.toString() || "0",
      videosCount: 0,
      description: cachedData.description || "No description yet.",
      verified: false,
    };
  }
  return {
    id: id,
    name: `Channel ${id}`,
    handle: `@channel${id}`,
    avatar: `https://ui-avatars.com/api/?name=Channel+${id}&background=random&color=fff&size=128`,
    banner: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200",
    subscribers: "0",
    joinedDate: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    totalViews: "0",
    videosCount: 0,
    description: "No description yet.",
    verified: false,
  };
};

export default function ChannelPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const channelId = params?.id as string || "1";
  const BACKEND_URL = getBackendUrl();
  
  const [channel, setChannel] = useState<ChannelData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams?.get("tab") || "videos");
  const [showUploader, setShowUploader] = useState(false);
  const [channelVideos, setChannelVideos] = useState<VideoType[]>([]);
  const [isOwnChannel, setIsOwnChannel] = useState(false);

  // Sync active tab with URL query parameter
  useEffect(() => {
    const tab = searchParams?.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    router.replace(`/channel/${channelId}?tab=${tabId}`);
  };

  const fetchVideos = async () => {
    try {
      const userId = channelId || "1";
      const res = await fetch(`${BACKEND_URL}/api/upload/user/${userId}`);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      setChannelVideos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch error:", err);
      setChannelVideos([]);
    }
  };

  useEffect(() => {
    const userId = channelId || "1";
    let cachedData = null;
    
    if (typeof window !== "undefined") {
      const savedChannel = localStorage.getItem("channelData");
      if (savedChannel) {
        try {
          const parsed = JSON.parse(savedChannel);
          // If the handles match, or if it's the current user's UID
          const currentHandle = parsed.handle?.replace("@", "");
          const currentUserId = localStorage.getItem("userId");
          
          if (currentHandle === userId || currentUserId === userId) {
            cachedData = parsed;
            setIsOwnChannel(true);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    setChannel(getSampleChannelData(userId, cachedData));
    setIsLoading(false);
    fetchVideos();
  }, [channelId]);

  const handleUploadComplete = () => {
    setShowUploader(false);
    fetchVideos();
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm("Are you sure you want to delete this video?")) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/upload/video/${videoId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to delete video");
      }
      fetchVideos();
    } catch (err) {
      console.error("Error deleting video:", err);
      alert("Failed to delete video.");
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  const tabs = [
    { id: "videos", label: "Videos", icon: Video },
    { id: "playlists", label: "Playlists", icon: ListVideo },
    { id: "community", label: "Community", icon: Users },
    { id: "channels", label: "Channels", icon: Users },
    { id: "about", label: "About", icon: Home },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <ChannelHeader channel={channel!} isOwnChannel={isOwnChannel} />
      
      <div className="max-w-7xl mx-auto px-4">
        {isOwnChannel && (
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowUploader(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
            >
              <Upload className="w-4 h-4" />
              Upload Video
            </button>
          </div>
        )}
        
        <ChannelTab activeTab={activeTab} onTabChange={handleTabChange} variant="underline" tabs={tabs} />
        
        <div className="py-6">
          <TabPanel id="videos" activeTab={activeTab}>
            <ChannelVideos 
              channelId={channelId || "1"}
              isOwnChannel={isOwnChannel}
              showSearch={true}
              videos={channelVideos}
              onVideoDelete={handleDeleteVideo}
            />
          </TabPanel>
          <TabPanel id="playlists" activeTab={activeTab}>
            <div className="text-center py-16">No playlists yet</div>
          </TabPanel>
          <TabPanel id="community" activeTab={activeTab}>
            <div className="text-center py-16">No community posts yet</div>
          </TabPanel>
          <TabPanel id="channels" activeTab={activeTab}>
            <div className="text-center py-16">No featured channels</div>
          </TabPanel>
          <TabPanel id="about" activeTab={activeTab}>
            <div className="max-w-3xl">
              <p>{channel?.description}</p>
            </div>
          </TabPanel>
        </div>
      </div>

      {showUploader && (
        <VideoUploader
          channelId={channelId || "1"}
          onUploadComplete={handleUploadComplete}
          onClose={() => setShowUploader(false)}
        />
      )}
    </div>
  );
}