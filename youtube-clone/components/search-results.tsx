"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  channel: string;
  channelAvatar: string;
  thumbnail: string;
  views: string;
  timestamp: string;
  duration: string;
  description: string;
}

interface SearchResultsProps {
  initialQuery?: string;
  onResultClick?: () => void;
}

// Extensive video database for search
const videoDatabase: SearchResult[] = [
  {
    id: "1",
    title: "Java Programming Tutorial for Beginners",
    channel: "CodeMaster",
    channelAvatar: "https://ui-avatars.com/api/?name=CodeMaster&background=E74C3C&color=fff&size=32",
    thumbnail: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400",
    views: "124K views",
    timestamp: "2 days ago",
    duration: "45:30",
    description: "Learn Java programming from scratch. This complete tutorial covers all the basics you need to know to start coding in Java.",
  },
  {
    id: "2",
    title: "JavaScript Mastery - Complete Course 2024",
    channel: "WebDev Simplified",
    channelAvatar: "https://ui-avatars.com/api/?name=WebDev&background=2ECC71&color=fff&size=32",
    thumbnail: "https://images.unsplash.com/photo-1592609931095-54a2168ae893?w=400",
    views: "256K views",
    timestamp: "1 week ago",
    duration: "18:42",
    description: "Master JavaScript with this comprehensive course. Learn ES6+, async programming, and more.",
  },
  {
    id: "3",
    title: "React Hooks Complete Guide",
    channel: "React University",
    channelAvatar: "https://ui-avatars.com/api/?name=React&background=61DAFB&color=000&size=32",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400",
    views: "89K views",
    timestamp: "3 days ago",
    duration: "22:15",
    description: "Master React Hooks with this complete guide. Learn useState, useEffect, useContext, and more.",
  },
  {
    id: "4",
    title: "Next.js 15 Tutorial for Beginners",
    channel: "NextMaster",
    channelAvatar: "https://ui-avatars.com/api/?name=Next&background=000000&color=fff&size=32",
    thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400",
    views: "312K views",
    timestamp: "4 days ago",
    duration: "28:33",
    description: "Learn Next.js 15 from scratch. Build modern web applications with React and Next.js.",
  },
  {
    id: "5",
    title: "Python for Data Science",
    channel: "Data Science Hub",
    channelAvatar: "https://ui-avatars.com/api/?name=Data&background=3498DB&color=fff&size=32",
    thumbnail: "https://images.unsplash.com/photo-1526379095098-d4fd0be2d3b9?w=400",
    views: "567K views",
    timestamp: "1 month ago",
    duration: "52:20",
    description: "Learn Python programming for data science. Master pandas, numpy, and data visualization.",
  },
  {
    id: "6",
    title: "Amazing Nature Documentary",
    channel: "Nature Channel",
    channelAvatar: "https://ui-avatars.com/api/?name=Nature&background=1ABC9C&color=fff&size=32",
    thumbnail: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400",
    views: "45K views",
    timestamp: "less than a minute ago",
    duration: "45:30",
    description: "Experience the beauty of nature in this stunning documentary filmed across 6 continents.",
  },
  {
    id: "7",
    title: "HTML & CSS Full Course",
    channel: "WebDev Simplified",
    channelAvatar: "https://ui-avatars.com/api/?name=WebDev&background=2ECC71&color=fff&size=32",
    thumbnail: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=400",
    views: "1.2M views",
    timestamp: "3 months ago",
    duration: "1:20:15",
    description: "Complete HTML and CSS course for beginners. Build modern websites from scratch.",
  },
  {
    id: "8",
    title: "TypeScript Tutorial - Full Course",
    channel: "TypeScript Master",
    channelAvatar: "https://ui-avatars.com/api/?name=TS&background=3178C6&color=fff&size=32",
    thumbnail: "https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=400",
    views: "234K views",
    timestamp: "2 weeks ago",
    duration: "38:45",
    description: "Master TypeScript with this comprehensive tutorial. Learn types, interfaces, generics, and more.",
  },
  {
    id: "9",
    title: "Jazz Music for Studying and Relaxation",
    channel: "Jazz Cafe",
    channelAvatar: "https://ui-avatars.com/api/?name=Jazz&background=F39C12&color=fff&size=32",
    thumbnail: "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?w=400",
    views: "1.2M views",
    timestamp: "6 months ago",
    duration: "32:10",
    description: "Relaxing jazz music perfect for studying, working, or just unwinding after a long day.",
  },
  {
    id: "10",
    title: "Jason and the Argonauts - Full Movie",
    channel: "Classic Movies",
    channelAvatar: "https://ui-avatars.com/api/?name=Movies&background=9B59B6&color=fff&size=32",
    thumbnail: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400",
    views: "8.2M views",
    timestamp: "2 years ago",
    duration: "18:42",
    description: "The classic adventure film about Jason and his quest for the Golden Fleece.",
  },
];

const SearchResults = ({ 
  initialQuery = "", 
  onResultClick
}: SearchResultsProps) => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Function to perform search
  const performSearch = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }
    
    setIsLoading(true);
    
    // Simulate network delay
    setTimeout(() => {
      const searchLower = searchTerm.toLowerCase().trim();
      
      const filtered = videoDatabase.filter(video => {
        const titleMatch = video.title.toLowerCase().includes(searchLower);
        const channelMatch = video.channel.toLowerCase().includes(searchLower);
        const descMatch = video.description.toLowerCase().includes(searchLower);
        return titleMatch || channelMatch || descMatch;
      });
      
      setResults(filtered);
      setIsLoading(false);
    }, 300);
  }, []);

  // Run search when query changes
  useEffect(() => {
    performSearch(query);
  }, [query, performSearch]);

  // Update query when initialQuery changes (from URL)
  useEffect(() => {
    if (initialQuery && initialQuery !== query) {
      setQuery(initialQuery);
    }
  }, [initialQuery, query]);

  if (!query) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Search for videos</h2>
        <p className="text-gray-500">Enter a search term in the header to find videos</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Results Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold">
          Search results for "{query}"
          <span className="text-sm font-normal text-gray-500 ml-2">
            ({results.length} results)
          </span>
        </h1>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-48 h-27 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {!isLoading && results.length === 0 && (
        <div className="text-center py-16">
          <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No results found</h2>
          <p className="text-gray-500 mb-4">We couldn't find any videos matching "{query}"</p>
          <p className="text-sm text-gray-400">Try different keywords or check your spelling</p>
        </div>
      )}

      {/* Results List */}
      {!isLoading && results.length > 0 && (
        <div className="space-y-6">
          {results.map((result) => (
            <Link
              key={result.id}
              href={`/watch/${result.id}`}
              onClick={onResultClick}
              className="flex gap-4 group cursor-pointer"
            >
              {/* Thumbnail */}
              <div className="relative w-48 flex-shrink-0">
                <div className="aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden">
                  <Image
                    src={result.thumbnail}
                    alt={result.title}
                    width={192}
                    height={108}
                    className="object-cover w-full h-full group-hover:scale-105 transition duration-300"
                  />
                </div>
                <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                  {result.duration}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base group-hover:text-blue-600 line-clamp-2">
                  {result.title}
                </h3>
                
                <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mt-1">
                  <span>{result.views}</span>
                  <span>•</span>
                  <span>{result.timestamp}</span>
                </div>
                
                <div className="flex items-center gap-2 mt-1">
                  <Image
                    src={result.channelAvatar}
                    alt={result.channel}
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900">
                    {result.channel}
                  </p>
                </div>
                
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2 line-clamp-2">
                  {result.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchResults;