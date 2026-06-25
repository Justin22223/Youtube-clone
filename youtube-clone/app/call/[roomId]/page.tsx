"use client";

import { useEffect, useRef, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useWebRTC } from "@/hooks/useWebRTC";
import { VideoControls } from "@/components/call/video-controls";

export default function CallPage({ params }: { params: Promise<{ roomId: string }> }) {
  const router = useRouter();
  const { roomId } = use(params);
  
  const {
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    isScreenSharing,
    mediaError,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
  } = useWebRTC({ roomId });

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleToggleRecording = () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording
      const streamToRecord = remoteStream || localStream; // Prefer recording the remote stream, fallback to local
      
      // Better approach: Combine local and remote streams if both exist, but for simplicity
      // and typical use-case (recording the presentation/other person), we record the active remote stream,
      // or the local stream if sharing screen.
      // Let's create a combined stream if we want both, but typically a local user wants to record the screen share.
      // For now, let's record the local screen share if active, else remote stream.
      let targetStream = isScreenSharing ? localStream : (remoteStream || localStream);

      if (!targetStream) return;

      try {
        const options = { mimeType: "video/webm; codecs=vp9" };
        const recorder = new MediaRecorder(targetStream, options);
        
        recordedChunksRef.current = [];
        
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          document.body.appendChild(a);
          a.style.display = "none";
          a.href = url;
          a.download = `call-recording-${roomId}-${new Date().toISOString()}.webm`;
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        };

        recorder.start();
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
      } catch (err) {
        console.error("Failed to start recording", err);
      }
    }
  };

  const handleEndCall = () => {
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    // WebRTC cleanup is handled by the hook unmounting
    router.push("/");
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex items-center justify-center">
      {mediaError && (
        <div className="absolute top-0 left-0 w-full bg-red-500/90 text-white p-3 text-center z-50 shadow-md flex justify-center items-center gap-2">
          <span>⚠️</span>
          <p className="font-medium text-sm sm:text-base">{mediaError}</p>
        </div>
      )}

      {/* Remote Video (Main) */}
      <div className="w-full h-full">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-white space-y-4">
            <div className="animate-pulse h-24 w-24 rounded-full bg-zinc-800 flex items-center justify-center">
              <span className="text-zinc-500">Wait</span>
            </div>
            <p className="text-lg font-medium text-zinc-400">Waiting for others to join...</p>
            <p className="text-sm text-zinc-500">Room ID: {roomId}</p>
          </div>
        )}
      </div>

      {/* Local Video (PiP) */}
      <div className="absolute top-4 right-4 w-48 aspect-video bg-zinc-900 rounded-lg overflow-hidden border-2 border-zinc-800 shadow-xl z-10 transition-all duration-300 hover:scale-105">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
        />
        {isVideoOff && (
          <div className="w-full h-full flex items-center justify-center bg-zinc-900">
            <span className="text-zinc-500 text-sm">Camera Off</span>
          </div>
        )}
      </div>

      {/* Recording Indicator */}
      {isRecording && (
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500/20 px-3 py-1.5 rounded-full border border-red-500/50 z-10">
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
          <span className="text-red-500 text-sm font-medium">Recording</span>
        </div>
      )}

      {/* Controls */}
      <VideoControls
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        isScreenSharing={isScreenSharing}
        isRecording={isRecording}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={toggleScreenShare}
        onToggleRecording={handleToggleRecording}
        onEndCall={handleEndCall}
      />
    </div>
  );
}
