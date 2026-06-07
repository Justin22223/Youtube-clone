"use client";

import { useParams } from "next/navigation";
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

interface Video {
  _id: string;
  title: string;
  thumbnail: string;
  views: number;
  createdAt: string;
  duration?: string;
}

const getSampleChannelData = (id: string): ChannelData => {
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
  const channelId = params?.id as string || "1";
  
  const [channel, setChannel] = useState<ChannelData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("videos");
  const [showUploader, setShowUploader] = useState(false);
  const [channelVideos, setChannelVideos] = useState<Video[]>([]);
  const [isOwnChannel, setIsOwnChannel] = useState(true);

  const fetchVideos = async () => {
    try {
      const userId = channelId || "1";
      // HARDCODED URL - THIS WORKS
      const res = await fetch(`http://localhost:5000/api/upload/user/${userId}`);
      
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
    setChannel(getSampleChannelData(userId));
    setIsLoading(false);
    fetchVideos();
  }, [channelId]);

  const handleUploadComplete = () => {
    setShowUploader(false);
    fetchVideos();
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
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowUploader(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
          >
            <Upload className="w-4 h-4" />
            Upload Video
          </button>
        </div>
        
        <ChannelTab activeTab={activeTab} onTabChange={setActiveTab} variant="underline" tabs={tabs} />
        
        <div className="py-6">
          <TabPanel id="videos" activeTab={activeTab}>
            <ChannelVideos 
              channelId={channelId || "1"}
              isOwnChannel={isOwnChannel}
              showSearch={true}
              videos={channelVideos}
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