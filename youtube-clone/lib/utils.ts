import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getBackendUrl = () => {
  if (typeof window !== "undefined") {
    if (process.env.NEXT_PUBLIC_BACKEND_URL) {
      return process.env.NEXT_PUBLIC_BACKEND_URL;
    }
    const hostname = window.location.hostname;
    return `http://${hostname}:5000`;
  }
  return process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
};

export const getImageUrl = (url: string) => {
  if (!url) return "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400";
  
  const backendUrl = getBackendUrl().replace(/\/$/, "");
  
  if (url.startsWith("http")) {
    if (url.includes("localhost:5000") && !backendUrl.includes("localhost:5000")) {
      return url.replace(/https?:\/\/localhost:5000/, backendUrl);
    }
    return url;
  }
  
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${backendUrl}${path}`;
};

export const getVideoUrl = (url: string) => {
  if (!url) return "";
  
  const backendUrl = getBackendUrl().replace(/\/$/, "");
  
  if (url.startsWith("http")) {
    if (url.includes("localhost:5000") && !backendUrl.includes("localhost:5000")) {
      return url.replace(/https?:\/\/localhost:5000/, backendUrl);
    }
    return url;
  }
  
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${backendUrl}${path}`;
};
