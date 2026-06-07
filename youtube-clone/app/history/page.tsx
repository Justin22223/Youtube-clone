"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Clock, 
  Trash2, 
  X, 
  Search, 
  Filter,
  Check,
  ChevronDown,
  History as HistoryIcon,
  Eye,
  Calendar,
  Watch
} from "lucide-react";

interface HistoryItem {
  id: string;
  title: string;
  channel: string;
  channelAvatar: string;
  thumbnail: string;
  views: string;
  timestamp: string;
  watchedAt: string;
  duration: string;
  progress?: number;
}

const HistoryPage = () => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "today" | "yesterday" | "week" | "month">("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const sampleHistory: HistoryItem[] = [
    {
      id: "1",
      title: "Building a YouTube Clone with Next.js and shadcn/ui",
      channel: "CodeMaster",
      channelAvatar: "https://ui-avatars.com/api/?name=CodeMaster&background=E74C3C&color=fff&size=32",
      thumbnail: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400",
      views: "124K views",
      timestamp: "2 days ago",
      watchedAt: "2024-01-15T10:30:00",
      duration: "45:30",
      progress: 75,
    },
    {
      id: "2",
      title: "The Future of AI in 2025",
      channel: "TechToday",
      channelAvatar: "https://ui-avatars.com/api/?name=TechToday&background=3498DB&color=fff&size=32",
      thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400",
      views: "89K views",
      timestamp: "5 days ago",
      watchedAt: "2024-01-14T15:20:00",
      duration: "22:15",
      progress: 100,
    },
    {
      id: "3",
      title: "Top 10 JavaScript Frameworks to Learn",
      channel: "WebDev Simplified",
      channelAvatar: "https://ui-avatars.com/api/?name=WebDev&background=2ECC71&color=fff&size=32",
      thumbnail: "https://images.unsplash.com/photo-1592609931095-54a2168ae893?w=400",
      views: "256K views",
      timestamp: "1 week ago",
      watchedAt: "2024-01-13T09:15:00",
      duration: "18:42",
      progress: 45,
    },
    {
      id: "4",
      title: "How to Build a Startup from Scratch",
      channel: "Entrepreneur Life",
      channelAvatar: "https://ui-avatars.com/api/?name=Entrepreneur&background=F39C12&color=fff&size=32",
      thumbnail: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400",
      views: "45K views",
      timestamp: "3 days ago",
      watchedAt: "2024-01-12T14:45:00",
      duration: "32:10",
      progress: 30,
    },
    {
      id: "5",
      title: "Mastering React Server Components",
      channel: "React University",
      channelAvatar: "https://ui-avatars.com/api/?name=React&background=9B59B6&color=fff&size=32",
      thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400",
      views: "312K views",
      timestamp: "4 days ago",
      watchedAt: "2024-01-11T11:00:00",
      duration: "28:33",
      progress: 60,
    },
    {
      id: "6",
      title: "Amazing Nature Documentary",
      channel: "NatGeo",
      channelAvatar: "https://ui-avatars.com/api/?name=NatGeo&background=1ABC9C&color=fff&size=32",
      thumbnail: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400",
      views: "1.2M views",
      timestamp: "2 weeks ago",
      watchedAt: "2024-01-10T08:30:00",
      duration: "52:20",
      progress: 100,
    },
  ];

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      const savedHistory = localStorage.getItem("watchHistory");
      if (savedHistory) {
        setHistoryItems(JSON.parse(savedHistory));
      } else {
        setHistoryItems(sampleHistory);
      }
      setIsLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    if (historyItems.length > 0 && !isLoading) {
      localStorage.setItem("watchHistory", JSON.stringify(historyItems));
    }
  }, [historyItems, isLoading]);

  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === filteredHistory.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredHistory.map(item => item.id)));
    }
  };

  const handleClearSelected = () => {
    setHistoryItems(prev => prev.filter(item => !selectedItems.has(item.id)));
    setSelectedItems(new Set());
    setIsSelectionMode(false);
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear all watch history?")) {
      setHistoryItems([]);
      localStorage.removeItem("watchHistory");
    }
  };

  const handleRemoveItem = (id: string) => {
    setHistoryItems(prev => prev.filter(item => item.id !== id));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  const filterHistory = () => {
    let filtered = [...historyItems];
    
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.channel.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    switch (filterType) {
      case "today":
        filtered = filtered.filter(item => new Date(item.watchedAt) >= today);
        break;
      case "yesterday":
        filtered = filtered.filter(item => {
          const watchDate = new Date(item.watchedAt);
          return watchDate >= yesterday && watchDate < today;
        });
        break;
      case "week":
        filtered = filtered.filter(item => new Date(item.watchedAt) >= weekAgo);
        break;
      case "month":
        filtered = filtered.filter(item => new Date(item.watchedAt) >= monthAgo);
        break;
      default:
        break;
    }
    
    filtered.sort((a, b) => new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime());
    
    return filtered;
  };

  const filteredHistory = filterHistory();

  const groupedHistory = filteredHistory.reduce((groups, item) => {
    const date = formatDate(item.watchedAt);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {} as Record<string, HistoryItem[]>);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-48 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-40 h-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <HistoryIcon className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Watch history</h1>
        </div>
        
        {historyItems.length > 0 && (
          <div className="flex gap-2">
            {!isSelectionMode ? (
              <>
                <button
                  onClick={() => setIsSelectionMode(true)}
                  className="px-4 py-2 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
                >
                  Select
                </button>
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition"
                >
                  Clear all
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSelectAll}
                  className="px-4 py-2 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
                >
                  {selectedItems.size === filteredHistory.length ? "Deselect all" : "Select all"}
                </button>
                {selectedItems.size > 0 && (
                  <button
                    onClick={handleClearSelected}
                    className="px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition"
                  >
                    Delete ({selectedItems.size})
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsSelectionMode(false);
                    setSelectedItems(new Set());
                  }}
                  className="px-4 py-2 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {historyItems.length > 0 && (
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search in watch history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-full focus:outline-none focus:border-blue-500 dark:bg-gray-900"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm">
                {filterType === "all" && "All time"}
                {filterType === "today" && "Today"}
                {filterType === "yesterday" && "Yesterday"}
                {filterType === "week" && "Last 7 days"}
                {filterType === "month" && "Last 30 days"}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {showFilterMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                  {[
                    { value: "all", label: "All time" },
                    { value: "today", label: "Today" },
                    { value: "yesterday", label: "Yesterday" },
                    { value: "week", label: "Last 7 days" },
                    { value: "month", label: "Last 30 days" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setFilterType(option.value as any);
                        setShowFilterMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition ${
                        filterType === option.value ? "bg-gray-100 dark:bg-gray-700 font-semibold" : ""
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {historyItems.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <HistoryIcon className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Watch history is empty</h2>
          <p className="text-gray-500 mb-6">Videos you watch will appear here</p>
          <Link
            href="/"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
          >
            Browse videos
          </Link>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500">No matching videos found in your history</p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="mt-4 text-blue-600 hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedHistory).map(([date, items]) => (
            <div key={date}>
              <h2 className="text-lg font-semibold mb-3 sticky top-14 bg-white dark:bg-black py-2 z-10">
                {date}
              </h2>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 group">
                    {isSelectionMode && (
                      <div className="flex items-center">
                        <button
                          onClick={() => handleSelectItem(item.id)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                            selectedItems.has(item.id)
                              ? "bg-blue-600 border-blue-600"
                              : "border-gray-400 hover:border-blue-500"
                          }`}
                        >
                          {selectedItems.has(item.id) && <Check className="w-3 h-3 text-white" />}
                        </button>
                      </div>
                    )}
                    
                    <Link href={`/watch/${item.id}`} className="flex-shrink-0">
                      <div className="relative w-40">
                        <div className="aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden">
                          <Image
                            src={item.thumbnail}
                            alt={item.title}
                            width={160}
                            height={90}
                            className="object-cover w-full h-full group-hover:scale-105 transition"
                          />
                        </div>
                        <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                          {item.duration}
                        </span>
                        {item.progress && item.progress < 100 && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600/50">
                            <div 
                              className="h-full bg-red-600"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </Link>
                    
                    <div className="flex-1 min-w-0">
                      <Link href={`/watch/${item.id}`}>
                        <h3 className="font-semibold text-base hover:text-blue-600 line-clamp-2">
                          {item.title}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <Image
                          src={item.channelAvatar}
                          alt={item.channel}
                          width={20}
                          height={20}
                          className="rounded-full"
                        />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.channel}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span>{item.views}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{item.timestamp}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Watched {formatDate(item.watchedAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {!isSelectionMode && (
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
                        title="Remove from history"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;