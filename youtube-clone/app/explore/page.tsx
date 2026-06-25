import { Suspense } from "react";
import VideoGridSkeleton from "@/components/video-grid-skeleton";
import VideoGrid from "@/components/video-grid";
import { Compass } from "lucide-react";

export default function ExplorePage() {
  return (
    <div className="flex flex-col gap-6 w-full pb-10 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
            <Compass className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold">Explore</h1>
        </div>
        <div className="flex flex-wrap gap-3 sm:ml-6 mt-2 sm:mt-0">
          <button className="px-5 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition rounded-xl text-sm font-medium">Trending</button>
          <button className="px-5 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition rounded-xl text-sm font-medium">Music</button>
          <button className="px-5 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition rounded-xl text-sm font-medium">Gaming</button>
          <button className="px-5 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition rounded-xl text-sm font-medium">News</button>
        </div>
      </div>
      <div className="mt-4">
        <h2 className="text-xl font-bold mb-6">Trending Videos</h2>
        <Suspense fallback={<VideoGridSkeleton />}>
          <VideoGrid />
        </Suspense>
      </div>
    </div>
  );
}
