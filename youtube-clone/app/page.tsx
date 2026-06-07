import { Suspense } from "react";
import VideoGridSkeleton from "@/components/video-grid-skeleton";
import VideoGrid from "@/components/video-grid";

export default function Home() {
  return (
    <Suspense fallback={<VideoGridSkeleton />}>
      <VideoGrid />
    </Suspense>
  );
}