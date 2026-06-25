"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useSidebar } from "@/lib/SidebarContext";
import { 
  Home, 
  Compass, 
  Users, 
  History, 
  ThumbsUp, 
  Clock, 
  User,
  PlaySquare,
  PlusCircle,
  Download
} from "lucide-react";
import ChannelDialog from "./channel-dialog";
import { ElementType } from "react";

interface MenuItem {
  name: string;
  icon: ElementType;
  path: string;
  action?: () => void;
  isCreateChannel?: boolean;
}

const Sidebar = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isSidebarOpen, closeSidebarMobile } = useSidebar();
  const [hasChannel, setHasChannel] = useState(false);
  const [channelHandle, setChannelHandle] = useState("1");
  const [isChannelDialogOpen, setIsChannelDialogOpen] = useState(false);
  const [channelData, setChannelData] = useState<any>(null);

  // Check if user has a channel
  useEffect(() => {
    const savedChannel = localStorage.getItem("channelData");
    const hasChannelFlag = localStorage.getItem("hasChannel");
    
    if (savedChannel && hasChannelFlag === "true") {
      const channel = JSON.parse(savedChannel);
      setHasChannel(true);
      setChannelHandle(channel.handle?.replace("@", "") || "1");
      setChannelData(channel);
    } else {
      setHasChannel(false);
    }
  }, []);

  const handleCreateChannel = (newChannelData: any) => {
    localStorage.setItem("channelData", JSON.stringify(newChannelData));
    localStorage.setItem("hasChannel", "true");
    setHasChannel(true);
    setChannelHandle(newChannelData.handle?.replace("@", "") || "1");
    setChannelData(newChannelData);
    setIsChannelDialogOpen(false);
    // Force a hard refresh to update the sidebar
    window.location.href = `/channel/${newChannelData.handle?.replace("@", "") || "1"}`;
  };

  const menuItems: MenuItem[] = [
    { name: "Home", icon: Home, path: "/" },
    { name: "Explore", icon: Compass, path: "/explore" },
    { name: "Subscription", icon: Users, path: "/feed/subscriptions" },
    { name: "History", icon: History, path: "/history" },
    { name: "Liked videos", icon: ThumbsUp, path: "/liked" },
    { name: "Watch later", icon: Clock, path: "/watch-later" },
    { name: "Downloads", icon: Download, path: "/downloads" },
  ];

  const channelItems: MenuItem[] = hasChannel 
    ? [
        { name: "Your channel", icon: User, path: `/channel/${channelHandle}` },
        { name: "Your videos", icon: PlaySquare, path: `/channel/${channelHandle}?tab=videos` },
      ]
    : [
        { name: "Create a channel", icon: PlusCircle, path: "#", action: () => setIsChannelDialogOpen(true), isCreateChannel: true },
      ];

  const allMenuItems = [...menuItems, ...channelItems];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={closeSidebarMobile}
        />
      )}

      <aside 
        className={`fixed left-0 top-14 h-[calc(100vh-3.5rem)] overflow-y-auto overflow-x-hidden bg-white border-r dark:bg-black dark:border-gray-800 transition-all duration-300 ease-in-out z-50
          ${isSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0 md:w-20"}`}
      >
        <div className="py-2 flex flex-col">
          {allMenuItems.map((item) => {
            const isChannelPage = pathname === `/channel/${channelHandle}`;
            const isVideosTab = searchParams?.get("tab") === "videos";
            
            let isActive = false;
            if (item.path !== "#") {
              if (item.name === "Your channel") {
                isActive = isChannelPage && !isVideosTab;
              } else if (item.name === "Your videos") {
                isActive = isChannelPage && isVideosTab;
              } else {
                isActive = pathname === item.path;
              }
            }
            
            // Fixed: Check if action exists on the item
            if (item.action) {
              return (
                <button
                  key={item.name}
                  onClick={item.action}
                  className={`w-full flex items-center gap-4 px-4 py-2 transition-colors ${
                    item.isCreateChannel
                      ? "text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <item.icon className={`w-6 h-6 flex-shrink-0 ${item.isCreateChannel ? "text-blue-600" : ""}`} />
                  <span className={`text-sm whitespace-nowrap ${item.isCreateChannel ? "font-medium" : ""} ${!isSidebarOpen ? "md:hidden" : "block"}`}>
                    {item.name}
                  </span>
                </button>
              );
            }
            
            return (
              <Link
                key={item.name}
                href={item.path}
                onClick={() => {
                  if (window.innerWidth < 768) closeSidebarMobile();
                }}
                className={`w-full flex items-center gap-4 px-4 py-2 transition-colors ${
                  isActive 
                    ? "bg-gray-100 dark:bg-gray-800 text-black" 
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <item.icon className={`w-6 h-6 flex-shrink-0 ${isActive ? "text-black dark:text-white" : ""}`} />
                <span className={`text-sm whitespace-nowrap ${isActive ? "font-semibold" : ""} ${!isSidebarOpen ? "md:hidden" : "block"}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </aside>

      {/* Channel Dialog */}
      <ChannelDialog
        isOpen={isChannelDialogOpen}
        onClose={() => setIsChannelDialogOpen(false)}
        onSave={handleCreateChannel}
        mode="create"
      />
    </>
  );
};

export default Sidebar;