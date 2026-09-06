import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getBackendUrl = () => {
  return "";
};

export const getImageUrl = (url: string) => {
  if (!url) return "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400";
  
  const backendUrl = getBackendUrl();
  
  if (url.startsWith("http")) {
    if (url.includes("localhost:5000")) {
      return url.replace(/https?:\/\/localhost:5000/, backendUrl);
    }
    return url;
  }
  
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${backendUrl}${path}`;
};

export const getVideoUrl = (url: string) => {
  if (!url) return "";
  
  const backendUrl = getBackendUrl();
  
  if (url.startsWith("http")) {
    if (url.includes("localhost:5000")) {
      return url.replace(/https?:\/\/localhost:5000/, backendUrl);
    }
    return url;
  }
  
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${backendUrl}${path}`;
};

export const getEmbedUrl = (url: string) => {
  let videoUrl = getVideoUrl(url);
  let isYouTube = false;
  
  if (videoUrl) {
    if (videoUrl.includes("youtube.com/watch?v=")) {
      videoUrl = videoUrl.replace("youtube.com/watch?v=", "youtube.com/embed/");
      videoUrl = videoUrl.split("&")[0];
      isYouTube = true;
    } else if (videoUrl.includes("youtu.be/")) {
      videoUrl = videoUrl.replace("youtu.be/", "www.youtube.com/embed/");
      videoUrl = videoUrl.split("?")[0];
      isYouTube = true;
    } else if (videoUrl.includes("youtube.com/embed/")) {
      isYouTube = true;
    }
  }
  
  return { url: videoUrl, isYouTube };
};


export const getAvatarUrl = (name: string, bg?: string) => {
  const bgColor = bg && bg !== 'random' ? '#' + bg : ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C'][Math.floor(Math.random() * 6)];
  const initials = name ? name.substring(0, 2).toUpperCase() : 'U';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <rect width="100" height="100" fill="${bgColor}"/>
    <text x="50" y="50" font-family="Arial, sans-serif" font-size="40" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${initials}</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
};
