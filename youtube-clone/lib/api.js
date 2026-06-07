import axiosInstance from "./axiosinstance.js";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export const api = {
  // Save Firebase user to MongoDB
  saveFirebaseUser: async (userData) => {
    try {
      const response = await axiosInstance.post("/api/auth/firebase/save", userData);
      return response.data;
    } catch (error) {
      console.error("Save Firebase user error:", error);
      throw error;
    }
  },

  // Get user by Firebase UID
  getFirebaseUser: async (uid) => {
    try {
      const response = await axiosInstance.get(`/api/auth/firebase/user/${uid}`);
      return response.data;
    } catch (error) {
      console.error("Get Firebase user error:", error);
      throw error;
    }
  },

  // Email/Password Register
  register: async (userData) => {
    const response = await axiosInstance.post("/api/auth/register", userData);
    return response.data;
  },

  // Email/Password Login
  login: async (credentials) => {
    const response = await axiosInstance.post("/api/auth/login", credentials);
    return response.data;
  },

  // Get user profile
  getUserProfile: async (userId) => {
    const response = await axiosInstance.get(`/api/auth/profile/${userId}`);
    return response.data;
  },

  // Update user profile
  updateUserProfile: async (userId, data) => {
    const response = await axiosInstance.put(`/api/auth/profile/${userId}`, data);
    return response.data;
  },

  // Subscribe to channel
  subscribeToChannel: async (channelId, userId) => {
    const response = await axiosInstance.put(`/api/auth/subscribe/${channelId}`, { userId });
    return response.data;
  },
};