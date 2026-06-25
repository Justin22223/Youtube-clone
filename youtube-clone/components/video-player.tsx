"use client";

import { useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";

interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
  onOpenComments?: () => void;
  onNextVideo?: () => void;
}

const VideoPlayer = ({ videoUrl, title, onOpenComments, onNextVideo }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true); // Default to autoPlay=true
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Gesture refs
  const tapCountRef = useRef(0);
  const lastTapZoneRef = useRef<string | null>(null);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVideoClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    
    let zone = "center";
    if (x < width / 3) zone = "left";
    else if (x > (2 * width) / 3) zone = "right";

    if (lastTapZoneRef.current !== zone) {
        tapCountRef.current = 1;
        lastTapZoneRef.current = zone;
    } else {
        tapCountRef.current += 1;
    }

    if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
    }

    tapTimeoutRef.current = setTimeout(() => {
        const count = tapCountRef.current;
        const finalZone = lastTapZoneRef.current;
        
        tapCountRef.current = 0;
        lastTapZoneRef.current = null;

        if (count === 1 && finalZone === "center") {
            togglePlay();
        } else if (count === 2) {
            if (finalZone === "right") {
                if (videoRef.current) videoRef.current.currentTime += 10;
            } else if (finalZone === "left") {
                if (videoRef.current) videoRef.current.currentTime -= 10;
            } else if (finalZone === "center") {
                togglePlay();
            }
        } else if (count >= 3) {
            if (finalZone === "center") {
                if (onNextVideo) onNextVideo();
            } else if (finalZone === "right") {
                try {
                    window.close();
                } catch (e) {
                    // ignore
                }
                window.location.href = "about:blank"; // Fallback for closing website
            } else if (finalZone === "left") {
                if (onOpenComments) onOpenComments();
            }
        }
    }, 300);
  };

  return (
    <div className="relative group w-full h-full flex items-center justify-center bg-black overflow-hidden select-none">
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        autoPlay
        playsInline
      />
      
      {/* Clickable Overlay for Gestures */}
      <div 
        className="absolute inset-0 z-0 cursor-pointer"
        onClick={handleVideoClick}
        style={{ touchAction: 'none' }}
      />
      
      {/* Video Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition duration-300 z-10 pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <button onClick={togglePlay} className="text-white hover:text-blue-400 transition">
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </button>
          
          <button onClick={toggleMute} className="text-white hover:text-blue-400 transition">
            {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </button>
          
          <span className="text-white text-sm font-medium">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          
          <div className="flex-1 px-2">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={(e) => {
                if (videoRef.current) {
                  videoRef.current.currentTime = parseFloat(e.target.value);
                }
              }}
              className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer accent-red-600"
            />
          </div>
          
          <button 
            onClick={() => {
                const container = videoRef.current?.parentElement;
                if (container?.requestFullscreen) container.requestFullscreen();
            }} 
            className="text-white hover:text-blue-400 transition"
          >
            <Maximize className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;