"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, Search, Mic, Video, Bell, LogOut, History, ThumbsUp, Clock, PlusCircle, LogIn } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ChannelDialog from "./channel-dialog";
import { useAuth } from "@/lib/AuthContext";
import { getUserWithChannel, saveUserAfterLogin } from "@/lib/firebase";
import { ElementType } from "react";

interface MenuItem {
  name: string;
  icon: ElementType;
  path?: string;
  onClick?: () => void;
  divider?: boolean;
  isCreateChannel?: boolean;
  isSignOut?: boolean;
}

const Header = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isChannelDialogOpen, setIsChannelDialogOpen] = useState(false);
  const [hasChannel, setHasChannel] = useState(false);
  const [channelHandle, setChannelHandle] = useState<string>("1");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, logout, signInWithGoogle, loading } = useAuth();

  // Check if user has a channel (from Firebase Users collection)
  useEffect(() => {
    const checkUserChannel = async () => {
      if (user) {
        try {
          // First save user to Firestore if not exists
          await saveUserAfterLogin(user);
          
          // Get user data with channel from Users collection
          const userData = await getUserWithChannel(user.uid);
          console.log("User data from Firestore:", userData);
          
          // Fixed: Proper type checking for userData and channel
          if (userData && typeof userData === 'object' && 'hasChannel' in userData && 'channel' in userData && userData.hasChannel && userData.channel) {
            const channel = userData.channel as any;
            setHasChannel(true);
            setChannelHandle(channel.handle?.replace("@", "") || user.uid);
            localStorage.setItem("channelData", JSON.stringify(channel));
            localStorage.setItem("hasChannel", "true");
            localStorage.setItem("channelHandle", channel.handle?.replace("@", "") || user.uid);
          } else {
            setHasChannel(false);
          }
        } catch (error) {
          console.error("Error checking user channel:", error);
          setHasChannel(false);
        }
      } else {
        setHasChannel(false);
      }
    };
    
    checkUserChannel();
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      localStorage.removeItem("currentUserId");
      localStorage.removeItem("userToken");
      localStorage.removeItem("channelData");
      localStorage.removeItem("hasChannel");
      localStorage.removeItem("channelHandle");
      setHasChannel(false);
      setIsDropdownOpen(false);
      router.push("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      setIsDropdownOpen(false);
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  const handleCreateChannel = (channelData: any) => {
    // Store channel data (already saved to Firebase Users collection in ChannelDialog)
    setHasChannel(true);
    setChannelHandle(channelData.handle.replace("@", ""));
    localStorage.setItem("channelData", JSON.stringify(channelData));
    localStorage.setItem("hasChannel", "true");
    localStorage.setItem("channelHandle", channelData.handle.replace("@", ""));
    setIsChannelDialogOpen(false);
    setIsDropdownOpen(false);
    // Redirect to the channel page using the user's UID
    const redirectPath = user?.uid ? `/channel/${user.uid}` : `/channel/${channelData.handle.replace("@", "")}`;
    router.push(redirectPath);
  };

  // Menu items based on auth state
  const getMenuItems = (): MenuItem[] => {
    if (!user) {
      return [];
    }

    const items: MenuItem[] = [
      ...(hasChannel ? [
        { name: "Your Channel", icon: Video, path: `/channel/${user?.uid || channelHandle}`, onClick: () => setIsDropdownOpen(false) }
      ] : [
        { name: "Create Channel", icon: PlusCircle, onClick: () => { setIsChannelDialogOpen(true); setIsDropdownOpen(false); }, isCreateChannel: true },
      ]),
      { name: "History", icon: History, path: "/history", onClick: () => setIsDropdownOpen(false) },
      { name: "Liked videos", icon: ThumbsUp, path: "/liked", onClick: () => setIsDropdownOpen(false) },
      { name: "Watch later", icon: Clock, path: "/watch-later", onClick: () => setIsDropdownOpen(false) },
      { divider: true, name: "", icon: Video },
      { name: "Sign out", icon: LogOut, onClick: handleSignOut, isSignOut: true },
    ];
    
    return items;
  };

  const menuItems = getMenuItems();

  // User avatar and info
  const userAvatar = user?.photoURL || "https://randomuser.me/api/portraits/men/4.jpg";
  const userName = user?.displayName || "Guest User";
  const userEmail = user?.email || "guest@example.com";

  return (
    <>
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-2 bg-white border-b dark:bg-black dark:border-gray-800">
        {/* Left Section - Menu & Logo */}
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
            <Menu className="w-6 h-6" />
          </button>
          <Link href="/" className="flex items-center gap-1">
            <span className="text-2xl font-bold tracking-tight">
              <span className="text-red-600">You</span>
              <span className="text-black dark:text-white">Tube</span>
            </span>
          </Link>
        </div>

        {/* Center Section - Search Bar (ONLY ONE) */}
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-l-full focus:outline-none focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
              />
              <button
                type="submit"
                className="absolute right-0 top-0 h-full px-5 bg-gray-100 border border-l-0 border-gray-300 rounded-r-full hover:bg-gray-200 dark:bg-gray-700 dark:border-gray-600"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
            <button type="button" className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 dark:bg-gray-800">
              <Mic className="w-5 h-5" />
            </button>
          </div>
        </form>

        {/* Right Section - Actions & User */}
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-full transition">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition">
            <Bell className="w-5 h-5" />
          </button>
          
          {/* Sign In Button or User Profile Dropdown */}
          {!user ? (
            <button
              onClick={handleSignIn}
              className="px-4 py-1.5 bg-black text-white rounded-full hover:bg-gray-800 transition text-sm font-semibold flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="p-1 hover:bg-gray-100 rounded-full transition focus:outline-none"
              >
                <Image 
                  src={userAvatar}
                  alt="User avatar" 
                  width={32} 
                  height={32} 
                  className="rounded-full object-cover" 
                  style={{ width: "32px", height: "32px" }} 
                />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                  {/* User Info Section */}
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      <Image 
                        src={userAvatar}
                        alt="User avatar" 
                        width={40} 
                        height={40} 
                        className="rounded-full" 
                      />
                      <div>
                        <p className="font-semibold text-sm">{userName}</p>
                        <p className="text-xs text-gray-500">{userEmail}</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    {menuItems.map((item, index) => (
                      item.divider ? (
                        <div key={`divider-${index}`} className="my-1 h-px bg-gray-200 dark:bg-gray-800" />
                      ) : (
                        item.path ? (
                          <Link
                            key={item.name}
                            href={item.path}
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            {item.icon && <item.icon className="w-4 h-4" />}
                            <span>{item.name}</span>
                          </Link>
                        ) : (
                          <button
                            key={item.name}
                            onClick={item.onClick}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                              item.isSignOut 
                                ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" 
                                : item.isCreateChannel
                                ? "text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                            }`}
                          >
                            {item.icon && <item.icon className="w-4 h-4" />}
                            <span>{item.name}</span>
                          </button>
                        )
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

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

export default Header;