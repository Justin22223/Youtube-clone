"use client";

import { useState, useRef, useEffect } from "react";
import { 
  X, 
  Camera, 
  Globe, 
  Lock,
  Users,
  Link as LinkIcon,
  MapPin,
  Mail,
  Check,
  AlertCircle,
  Image as ImageIcon,
  Trash2
} from "lucide-react";
import Image from "next/image";
import { createUserWithChannel, updateUserChannel, getUserWithChannel } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";

interface ChannelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (channelData: ChannelFormData) => void;
  initialData?: ChannelFormData;
  mode?: "create" | "edit";
}

export interface ChannelFormData {
  name: string;
  handle: string;
  description: string;
  avatar?: File | string;
  banner?: File | string;
  location: string;
  website: string;
  email: string;
  visibility: "public" | "private";
  category: string;
  keywords: string[];
}

const categories = [
  "Education",
  "Entertainment",
  "Gaming",
  "Music",
  "Sports",
  "Technology",
  "News",
  "Comedy",
  "Travel",
  "Fashion",
  "Food",
  "Science",
];

const ChannelDialog = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData,
  mode = "create"
}: ChannelDialogProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<ChannelFormData>({
    name: initialData?.name || "",
    handle: initialData?.handle || "",
    description: initialData?.description || "",
    avatar: initialData?.avatar || "",
    banner: initialData?.banner || "",
    location: initialData?.location || "",
    website: initialData?.website || "",
    email: initialData?.email || user?.email || "",
    visibility: initialData?.visibility || "public",
    category: initialData?.category || "Education",
    keywords: initialData?.keywords || [],
  });
  
  const [avatarPreview, setAvatarPreview] = useState<string>(
    typeof initialData?.avatar === "string" ? initialData.avatar : ""
  );
  const [bannerPreview, setBannerPreview] = useState<string>(
    typeof initialData?.banner === "string" ? initialData.banner : ""
  );
  const [keywordInput, setKeywordInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "details" | "branding">("basic");
  const [saveError, setSaveError] = useState<string | null>(null);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node) && isOpen) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Load existing channel data if in edit mode
  useEffect(() => {
    const loadChannelData = async () => {
      if (mode === "edit" && user && initialData) {
        const userData = await getUserWithChannel(user.uid);
        // Fixed: Added proper type checking for userData
        if (userData && typeof userData === 'object' && 'channel' in userData && userData.channel) {
          const channel = userData.channel as any;
          setFormData({
            name: channel.name || "",
            handle: channel.handle || "",
            description: channel.description || "",
            avatar: channel.avatar || "",
            banner: channel.banner || "",
            location: channel.location || "",
            website: channel.website || "",
            email: channel.email || user.email || "",
            visibility: channel.visibility || "public",
            category: channel.category || "Education",
            keywords: channel.keywords || [],
          });
          setAvatarPreview(channel.avatar || "");
          setBannerPreview(channel.banner || "");
        }
      }
    };
    loadChannelData();
  }, [mode, user, initialData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Channel name is required";
    }
    if (!formData.handle.trim()) {
      newErrors.handle = "Channel handle is required";
    } else if (!formData.handle.startsWith("@")) {
      newErrors.handle = "Handle must start with @";
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }
    if (formData.website && !/^https?:\/\//.test(formData.website)) {
      newErrors.website = "URL must start with http:// or https://";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    if (!user) {
      setSaveError("You must be logged in to create a channel");
      return;
    }
    
    setIsSubmitting(true);
    setSaveError(null);
    
    try {
      const channelData = {
        name: formData.name,
        handle: formData.handle,
        description: formData.description,
        avatar: avatarPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random&color=fff&size=128`,
        banner: bannerPreview || "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200",
        location: formData.location,
        website: formData.website,
        email: formData.email || user.email,
        visibility: formData.visibility,
        category: formData.category,
        keywords: formData.keywords,
      };
      
      const userData = {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        hasChannel: true,
      };
      
      // Save channel data inside Users collection
      await createUserWithChannel(user.uid, userData, channelData);
      
      console.log("Channel saved successfully inside Users collection");
      
      // Also save to localStorage for backward compatibility
      localStorage.setItem("channelData", JSON.stringify(channelData));
      localStorage.setItem("hasChannel", "true");
      localStorage.setItem("channelHandle", formData.handle.replace("@", ""));
      localStorage.setItem("userId", user.uid);
      
      if (onSave) {
        onSave(channelData);
      }
      
      onClose();
    } catch (error: any) {
      console.error("Error saving channel:", error);
      setSaveError(error.message || "Failed to create channel. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
      setFormData({ ...formData, avatar: file });
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setBannerPreview(previewUrl);
      setFormData({ ...formData, banner: file });
    }
  };

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !formData.keywords.includes(keywordInput.trim())) {
      setFormData({
        ...formData,
        keywords: [...formData.keywords, keywordInput.trim()]
      });
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setFormData({
      ...formData,
      keywords: formData.keywords.filter(k => k !== keyword)
    });
  };

  const removeAvatar = () => {
    setAvatarPreview("");
    setFormData({ ...formData, avatar: "" });
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  };

  const removeBanner = () => {
    setBannerPreview("");
    setFormData({ ...formData, banner: "" });
    if (bannerInputRef.current) bannerInputRef.current.value = "";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div 
        ref={dialogRef}
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden shadow-2xl animate-slide-up"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-xl font-semibold">
              {mode === "create" ? "Create a channel" : "Edit channel"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {mode === "create" 
                ? "Set up your channel to start sharing videos" 
                : "Update your channel information"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-gray-200 dark:border-gray-800 px-4">
          {[
            { id: "basic", label: "Basic Info", icon: Users },
            { id: "details", label: "Details", icon: Globe },
            { id: "branding", label: "Branding", icon: Camera },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {saveError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              {saveError}
            </div>
          )}
          
          {/* Basic Info Tab */}
          {activeTab === "basic" && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Channel name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., CodeMaster"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 ${
                    errors.name ? "border-red-500" : "border-gray-300 dark:border-gray-700"
                  }`}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Channel handle <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                  <input
                    type="text"
                    value={formData.handle.replace("@", "")}
                    onChange={(e) => setFormData({ ...formData, handle: `@${e.target.value}` })}
                    placeholder="username"
                    className={`w-full pl-7 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 ${
                      errors.handle ? "border-red-500" : "border-gray-300 dark:border-gray-700"
                    }`}
                  />
                </div>
                {errors.handle && <p className="text-xs text-red-500 mt-1">{errors.handle}</p>}
                <p className="text-xs text-gray-500 mt-1">
                  This is your unique channel URL: yourtube.com/@{formData.handle.replace("@", "")}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell viewers about your channel..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.description.length} / 5000 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Keywords</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.keywords.map((keyword) => (
                    <span key={keyword} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm">
                      {keyword}
                      <button onClick={() => handleRemoveKeyword(keyword)} className="hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddKeyword()}
                    placeholder="Add keywords (press Enter)"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                  />
                  <button onClick={handleAddKeyword} className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 transition">
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Details Tab */}
          {activeTab === "details" && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">Visibility</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" value="public" checked={formData.visibility === "public"} onChange={() => setFormData({ ...formData, visibility: "public" })} />
                    <Globe className="w-4 h-4" />
                    <span>Public</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" value="private" checked={formData.visibility === "private"} onChange={() => setFormData({ ...formData, visibility: "private" })} />
                    <Lock className="w-4 h-4" />
                    <span>Private</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="City, Country" className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Website</label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="url" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} placeholder="https://yourwebsite.com" className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 ${errors.website ? "border-red-500" : "border-gray-300 dark:border-gray-700"}`} />
                </div>
                {errors.website && <p className="text-xs text-red-500 mt-1">{errors.website}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email (for business inquiries)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="contact@yourchannel.com" className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 ${errors.email ? "border-red-500" : "border-gray-300 dark:border-gray-700"}`} />
                </div>
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
            </div>
          )}

          {/* Branding Tab */}
          {activeTab === "branding" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Channel Banner</label>
                <div className="relative w-full h-40 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-xl overflow-hidden">
                  {bannerPreview ? (
                    <>
                      <Image src={bannerPreview} alt="Channel banner" fill className="object-cover" />
                      <button onClick={removeBanner} className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-600 rounded-full transition">
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </>
                  ) : (
                    <div onClick={() => bannerInputRef.current?.click()} className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-black/5 transition">
                      <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Click to upload banner</p>
                      <p className="text-xs text-gray-400">Recommended: 2560 x 423px</p>
                    </div>
                  )}
                  <input ref={bannerInputRef} type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Channel Avatar</label>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    {avatarPreview ? (
                      <div className="relative">
                        <Image src={avatarPreview} alt="Channel avatar" width={96} height={96} className="rounded-full object-cover" style={{ width: "96px", height: "96px" }} />
                        <button onClick={removeAvatar} className="absolute -top-1 -right-1 p-1 bg-red-600 rounded-full hover:bg-red-700 transition">
                          <Trash2 className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ) : (
                      <div onClick={() => avatarInputRef.current?.click()} className="w-24 h-24 bg-gray-200 dark:bg-gray-800 rounded-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-300 transition">
                        <Camera className="w-6 h-6 text-gray-500" />
                        <span className="text-xs text-gray-500 mt-1">Upload</span>
                      </div>
                    )}
                    <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </div>
                  <div className="text-sm text-gray-500">
                    <p>Recommended size: 800 x 800px</p>
                    <p>Supported formats: JPG, PNG, GIF</p>
                    <p>Maximum size: 5MB</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <h3 className="text-sm font-semibold mb-3">Preview</h3>
                <div className="flex items-center gap-3">
                  {avatarPreview ? <Image src={avatarPreview} alt="Preview avatar" width={48} height={48} className="rounded-full" /> : <div className="w-12 h-12 bg-gray-300 rounded-full" />}
                  <div>
                    <p className="font-semibold">{formData.name || "Channel Name"}</p>
                    <p className="text-sm text-gray-500">{formData.handle || "@handle"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-800">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            Cancel
          </button>
          <button onClick={handleSave} disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {mode === "create" ? "Create Channel" : "Save Changes"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChannelDialog;