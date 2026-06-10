import Image from "next/image";
import Link from "next/link";
import { getImageUrl } from "@/lib/utils";

interface VideoProps {
  video: {
    id: number;
    title: string;
    channel: string;
    views: string;
    timestamp: string;
    thumbnail: string;
    avatar: string;
    duration: string;
  };
}

const VideoCard = ({ video }: VideoProps) => {
  return (
    <Link href={`/watch/${video.id}`} className="group">
      <div className="flex flex-col gap-2">
        {/* Thumbnail */}
        <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
          <img
            src={getImageUrl(video.thumbnail)}
            alt={video.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400";
            }}
          />
          <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
            {video.duration}
          </span>
        </div>

        {/* Video Info */}
        <div className="flex gap-3">
          {/* Channel Avatar */}
          <div className="flex-shrink-0">
            <Image
              src={video.avatar}
              alt={video.channel}
              width={36}
              height={36}
              className="rounded-full object-cover"
              style={{ width: "36px", height: "36px" }}
            />
          </div>

          {/* Title and Metadata */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold line-clamp-2 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400">
              {video.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
              {video.channel}
            </p>
            <div className="flex gap-1 text-sm text-gray-600 dark:text-gray-400">
              <span>{video.views}</span>
              <span>•</span>
              <span>{video.timestamp}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default VideoCard;