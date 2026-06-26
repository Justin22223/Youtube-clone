"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { getBackendUrl } from "@/lib/utils";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const { signUp, signIn, logout } = useAuth();
  const [step, setStep] = useState<"login" | "register" | "otp">("login");
  const [userId, setUserId] = useState<string | null>(null);
  const [otpMethod, setOtpMethod] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let region = "Unknown";
      try {
        const response = await fetch("https://ipapi.co/json/");
        const data = await response.json();
        region = data.region || "Unknown";
      } catch (err) {
        console.warn("Could not fetch region");
      }

      const response = await api.login({ email, password, region });
      if (response.requiresOtp) {
        setStep("otp");
        setUserId(response.userId);
        setOtpMethod(response.method);
        setPreviewUrl(response.previewUrl);
      } else {
        onSuccess(response.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Sync with Firebase Authentication and Firestore first
      try {
        await signUp(email, password, username);
        await logout(); // Log out from Firebase immediately so we go through OTP
      } catch (fbErr: any) {
        console.error("Firebase sign up issue:", fbErr);
        if (fbErr.code === 'auth/email-already-in-use') {
          try {
            await signIn(email, password);
            await logout();
          } catch (signInErr) {
            setError("Email is already registered. Please use correct password to link account or sign in.");
            setLoading(false);
            return;
          }
        } else {
          setError(fbErr.message || "Failed to create account in Firebase. Please ensure Email/Password sign-in is enabled in Firebase Console.");
          setLoading(false);
          return;
        }
      }

      try {
        await api.register({ username, email, password, mobileNumber });
      } catch (dbErr: any) {
        if (dbErr.response?.data?.message !== "User already exists") {
          throw dbErr;
        }
      }

      // Successfully registered, automatically log in to trigger OTP
      let region = "Unknown";
      try {
        const response = await fetch("https://ipapi.co/json/");
        const data = await response.json();
        region = data.region || "Unknown";
      } catch (err) {
        console.warn("Could not fetch region");
      }

      const response = await api.login({ email, password, region });
      if (response.requiresOtp) {
        setStep("otp");
        setUserId(response.userId);
        setOtpMethod(response.method);
        setPreviewUrl(response.previewUrl);
      } else {
        onSuccess(response.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${getBackendUrl()}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, otp }),
      });
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("userToken", data.token);
        localStorage.setItem("currentUserId", data.user.id);
        onSuccess(data.user);
        onClose();
      } else {
        setError(data.message || "Invalid OTP");
      }
    } catch (err: any) {
      setError("Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-xl w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4">
          {step === "login" ? "Sign In" : step === "register" ? "Sign Up" : "Verify OTP"}
        </h2>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        {step === "otp" && otpMethod && (
          <div className="mb-4">
            <p className="text-green-600 dark:text-green-400 text-sm mb-2">
              OTP sent via {otpMethod === "email" ? "Email" : "Gmail"}.
            </p>
            {previewUrl && (
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 dark:text-blue-400 text-xs hover:underline block break-all"
              >
                Click here to view your {otpMethod === "email" ? "Email" : "SMS Simulation"}
              </a>
            )}
          </div>
        )}

        <form onSubmit={step === "login" ? handleLogin : step === "register" ? handleRegister : handleVerifyOtp}>
          {(step === "login" || step === "register") && (
            <>
              {step === "register" && (
                <>
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Username</label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Mobile Number</label>
                    <input
                      type="tel"
                      required
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:border-blue-500"
                      placeholder="e.g. 9999999999"
                    />
                  </div>
                </>
              )}
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:border-blue-500"
                />
              </div>
            </>
          )}

          {step === "otp" && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Enter OTP</label>
              <input
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:border-blue-500 text-center tracking-widest text-lg"
                maxLength={6}
              />
            </div>
          )}

          <div className="flex flex-col gap-3">
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 rounded transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded transition disabled:opacity-50"
              >
                {loading ? "Please wait..." : step === "login" ? "Sign In" : step === "register" ? "Sign Up" : "Verify"}
              </button>
            </div>

            {step === "login" && (
              <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => { setStep("register"); setError(""); }}
                  className="text-blue-600 hover:underline"
                >
                  Sign up
                </button>
              </p>
            )}

            {step === "register" && (
              <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => { setStep("login"); setError(""); }}
                  className="text-blue-600 hover:underline"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
