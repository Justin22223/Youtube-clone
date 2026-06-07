import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC3N6P8XGMVCPUKJLiDbwiLHa_etancX3k",
  authDomain: "clone-48434.firebaseapp.com",
  projectId: "clone-48434",
  storageBucket: "clone-48434.firebasestorage.app",
  messagingSenderId: "376959042627",
  appId: "1:376959042627:web:3522878885b52d524300f6",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

// User/Channel functions - Store channel data inside Users collection
export const createUserWithChannel = async (userId, userData, channelData) => {
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, {
      ...userData,
      channel: {
        name: channelData.name,
        handle: channelData.handle,
        description: channelData.description,
        avatar: channelData.avatar,
        banner: channelData.banner,
        location: channelData.location,
        website: channelData.website,
        email: channelData.email,
        visibility: channelData.visibility,
        category: channelData.category,
        keywords: channelData.keywords,
        subscribers: 0,
        totalViews: 0,
        videosCount: 0,
        createdAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    });
    return userRef;
  } catch (error) {
    console.error("Error creating user with channel:", error);
    throw error;
  }
};

export const updateUserChannel = async (userId, channelData) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      "channel.name": channelData.name,
      "channel.handle": channelData.handle,
      "channel.description": channelData.description,
      "channel.avatar": channelData.avatar,
      "channel.banner": channelData.banner,
      "channel.location": channelData.location,
      "channel.website": channelData.website,
      "channel.email": channelData.email,
      "channel.visibility": channelData.visibility,
      "channel.category": channelData.category,
      "channel.keywords": channelData.keywords,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error updating user channel:", error);
    throw error;
  }
};

export const getUserWithChannel = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
};

export const saveUserAfterLogin = async (user) => {
  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      // Create new user document without channel initially
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        hasChannel: false,
      });
      console.log("User saved to Firestore");
    }
    return userRef;
  } catch (error) {
    console.error("Error saving user:", error);
    throw error;
  }
};

// Auth exports
export { 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs
};

export default app;