"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, CheckCircle, AlertCircle, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { getBackendUrl } from "@/lib/utils";

// Helper to capture a frame from the uploaded video file
const captureVideoFrame = (file: File): Promise<{ blob: Blob; duration: number }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    video.onloadedmetadata = () => {
      // Seek to 1 second or 10% of duration
      video.currentTime = Math.min(1.0, video.duration / 2);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            URL.revokeObjectURL(objectUrl);
            if (blob) {
              resolve({ blob, duration: video.duration });
            } else {
              reject(new Error("Canvas toBlob returned null"));
            }
          }, "image/jpeg", 0.85);
        } else {
          URL.revokeObjectURL(objectUrl);
          reject(new Error("Canvas context is not available"));
        }
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };

    video.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };
  });
};

interface VideoUploaderProps {
  channelId?: string;
  onUploadComplete?: (videoId: string) => void;
  onClose?: () => void;
  maxSize?: number;
}

const VideoUploader = ({ channelId, onUploadComplete, onClose }: VideoUploaderProps) => {
  const [step, setStep] = useState<"upload" | "details" | "processing" | "complete">("upload");
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "unlisted" | "private">("public");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [duration, setDuration] = useState("00:00");

  const formatDuration = (seconds: number): string => {
    if (isNaN(seconds) || seconds === Infinity) return "00:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      validateAndSetFile(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      validateAndSetFile(files[0]);
    }
  };

  const validateAndSetFile = async (file: File) => {
    setError(null);
    
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 100) {
      setError(`File too large. Maximum size is 100MB.`);
      return;
    }
    
    setSelectedFile(file);
    const previewUrl = URL.createObjectURL(file);
    setVideoPreview(previewUrl);
    setStep("details");

    // Capture thumbnail from video frame automatically
    try {
      const result = await captureVideoFrame(file);
      setThumbnailBlob(result.blob);
      const thumbUrl = URL.createObjectURL(result.blob);
      setThumbnailPreview(thumbUrl);
      setDuration(formatDuration(result.duration));
    } catch (err) {
      console.error("Failed to generate video thumbnail:", err);
    }
  };

  const handleRemoveFile = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    if (thumbnailPreview) {
      URL.revokeObjectURL(thumbnailPreview);
    }
    setSelectedFile(null);
    setVideoPreview(null);
    setThumbnailBlob(null);
    setThumbnailPreview(null);
    setDuration("00:00");
    setStep("upload");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      setError("Please enter a title for your video.");
      return;
    }
    
    if (!selectedFile) {
      setError("Please select a video file.");
      return;
    }
    
    setStep("processing");
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append("video", selectedFile);
    if (thumbnailBlob) {
      formData.append("thumbnail", thumbnailBlob, "thumbnail.jpg");
    }
    formData.append("title", title);
    formData.append("description", description);
    const userId = channelId || "1";
    formData.append("userId", userId);
    formData.append("visibility", visibility);
    formData.append("duration", duration);
    
    try {
      // Use configured Backend URL
      const BACKEND_URL = getBackendUrl();
      const response = await fetch(`${BACKEND_URL}/api/upload/video`, {
        method: "POST",
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }
      
      // Simulate progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 20;
        setUploadProgress(progress);
        if (progress >= 100) clearInterval(interval);
      }, 500);
      
      setTimeout(() => {
        clearInterval(interval);
        setUploadProgress(100);
        setStep("complete");
        
        if (onUploadComplete) {
          onUploadComplete(data.video?._id);
        }
      }, 2000);
      
    } catch (error: any) {
      console.error("Upload error:", error);
      setError(error.message || "Upload failed. Please try again.");
      setStep("upload");
    }
  };

  const togglePlayPause = () => {
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

  if (step === "upload") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl mx-4 overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-semibold">Upload a video</h2>
            {onClose && (
              <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <div
            className={`m-6 border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
              dragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "border-gray-300 hover:border-blue-500"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <Upload className="w-10 h-10 text-gray-500" />
            </div>
            
            <h3 className="text-lg font-semibold mb-2">Drag and drop video file</h3>
            <p className="text-sm text-gray-500 mb-2">or click to select files</p>
            <p className="text-xs text-gray-400">MP4, WebM, MOV • Up to 100MB</p>
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 rounded-lg flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (step === "details") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8">
        <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl mx-4 overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-800">
            <h2 className="text-xl font-semibold">Video details</h2>
            <button onClick={handleRemoveFile} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6">
            <div className="flex gap-6 flex-col md:flex-row">
              <div className="md:w-80 flex-shrink-0">
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden group">
                  {videoPreview && (
                    <>
                      <video
                        ref={videoRef}
                        src={videoPreview}
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        <button onClick={togglePlayPause} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition">
                          {isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white" />}
                        </button>
                        <button onClick={toggleMute} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition">
                          {isMuted ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {selectedFile?.name} ({(selectedFile!.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              </div>
              
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Add a title that describes your video"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell viewers about your video"
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 resize-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Thumbnail</label>
                  {thumbnailPreview ? (
                    <div className="relative w-40 aspect-video rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm">
                      <img src={thumbnailPreview} alt="Auto-generated thumbnail" className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                        Auto-generated
                      </span>
                    </div>
                  ) : (
                    <div className="w-40 aspect-video rounded-lg bg-gray-100 dark:bg-gray-800/50 flex items-center justify-center border border-dashed border-gray-300 dark:border-gray-700 text-xs text-gray-400 animate-pulse">
                      Generating frame...
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Visibility</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="public"
                        checked={visibility === "public"}
                        onChange={() => setVisibility("public")}
                      />
                      <span>Public</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="unlisted"
                        checked={visibility === "unlisted"}
                        onChange={() => setVisibility("unlisted")}
                      />
                      <span>Unlisted</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="private"
                        checked={visibility === "private"}
                        onChange={() => setVisibility("private")}
                      />
                      <span>Private</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t dark:border-gray-800">
              <button onClick={handleRemoveFile} className="px-4 py-2 border rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                Cancel
              </button>
              <button 
                onClick={handleUpload} 
                disabled={!title.trim() || !selectedFile} 
                className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Upload video
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === "processing") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md mx-4 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            {uploadProgress < 100 ? (
              <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
            ) : (
              <CheckCircle className="w-16 h-16 text-green-500" />
            )}
          </div>
          <h3 className="text-lg font-semibold mb-2">{uploadProgress < 100 ? "Uploading..." : "Upload complete!"}</h3>
          <p className="text-sm text-gray-500 mb-4">
            {uploadProgress < 100 ? `Processing your video (${uploadProgress}%)` : "Your video has been successfully uploaded"}
          </p>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6">
            <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
          </div>
          {uploadProgress === 100 && (
            <button onClick={() => onClose?.()} className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition">
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default VideoUploader;