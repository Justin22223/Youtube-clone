"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { 
  auth,
  provider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from "./firebase";
import { getUserWithChannel, saveUserAfterLogin } from "./firebase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dbUser, setDbUser] = useState(null);

  // Save Firebase user to Firestore
  const saveToFirestore = async (firebaseUser) => {
    try {
      await saveUserAfterLogin(firebaseUser);
      const userData = await getUserWithChannel(firebaseUser.uid);
      if (userData) {
        setDbUser(userData);
      }
      return userData;
    } catch (error) {
      console.error("Failed to save to Firestore:", error);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      await saveToFirestore(result.user);
      return result.user;
    } catch (error) {
      console.error("❌ Google Sign In Error:", error);
      throw error;
    }
  };

  // Sign in with email/password
  const signIn = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await saveToFirestore(userCredential.user);
      return userCredential.user;
    } catch (error) {
      console.error("Email Sign In Error:", error);
      throw error;
    }
  };

  // Sign up with email/password
  const signUp = async (email, password, displayName) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }
      await saveToFirestore(userCredential.user);
      return userCredential.user;
    } catch (error) {
      console.error("Sign Up Error:", error);
      throw error;
    }
  };

  // Sign out
  const logout = async () => {
    try {
      await signOut(auth);
      setDbUser(null);
      console.log("✅ User signed out");
    } catch (error) {
      console.error("Sign Out Error:", error);
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Password Reset Error:", error);
      throw error;
    }
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const userData = await getUserWithChannel(firebaseUser.uid);
          if (userData) {
            setDbUser(userData);
          } else {
            await saveToFirestore(firebaseUser);
          }
        } catch (error) {
          console.error("Error getting user data:", error);
        }
      } else {
        setDbUser(null);
      }
      
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const value = {
    user,
    dbUser,
    loading,
    signInWithGoogle,
    signIn,
    signUp,
    logout,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};