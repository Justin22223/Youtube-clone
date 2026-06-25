import { Suspense } from "react";
import VideoGridSkeleton from "@/components/video-grid-skeleton";
import VideoGrid from "@/components/video-grid";
import { Users } from "lucide-react";

export default function SubscriptionsPage() {
  return (
    <div className="flex flex-col gap-6 w-full pb-10 p-4">
      <div className="flex items-center gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
          <Users className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold">Subscriptions</h1>
      </div>
      <div className="mt-4">
        <h2 className="text-xl font-bold mb-6">Latest from your channels</h2>
        <Suspense fallback={<VideoGridSkeleton />}>
          <VideoGrid />
        </Suspense>
      </div>
    </div>
  );
}
