"use client";

import { Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, Circle, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoControlsProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  isRecording: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleRecording: () => void;
  onEndCall: () => void;
}

export function VideoControls({
  isMuted,
  isVideoOff,
  isScreenSharing,
  isRecording,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onToggleRecording,
  onEndCall,
}: VideoControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4 p-4 bg-zinc-950 border-t border-zinc-800 absolute bottom-0 left-0 w-full z-10">
      <Button
        variant={isMuted ? "destructive" : "secondary"}
        size="icon"
        className="rounded-full h-12 w-12"
        onClick={onToggleMute}
      >
        {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
      </Button>

      <Button
        variant={isVideoOff ? "destructive" : "secondary"}
        size="icon"
        className="rounded-full h-12 w-12"
        onClick={onToggleVideo}
      >
        {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
      </Button>

      <Button
        variant={isScreenSharing ? "default" : "secondary"}
        size="icon"
        className={`rounded-full h-12 w-12 ${isScreenSharing ? "bg-blue-600 hover:bg-blue-700" : ""}`}
        onClick={onToggleScreenShare}
      >
        <MonitorUp className="h-5 w-5" />
      </Button>

      <Button
        variant={isRecording ? "destructive" : "secondary"}
        size="icon"
        className="rounded-full h-12 w-12"
        onClick={onToggleRecording}
        title={isRecording ? "Stop Recording" : "Start Recording"}
      >
        {isRecording ? <Square className="h-5 w-5" /> : <Circle className="h-5 w-5 text-red-500 fill-current" />}
      </Button>

      <Button
        variant="destructive"
        size="icon"
        className="rounded-full h-12 w-12 ml-4 hover:bg-red-700"
        onClick={onEndCall}
      >
        <PhoneOff className="h-5 w-5" />
      </Button>
    </div>
  );
}
