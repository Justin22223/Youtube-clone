"use client";

import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

interface PremiumDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PLANS = [
  {
    name: "Bronze",
    price: 10,
    watchTime: "7 mins",
    color: "bg-orange-600",
    hover: "hover:bg-orange-700",
    features: ["7 minutes watch time limit", "Basic support"],
  },
  {
    name: "Silver",
    price: 50,
    watchTime: "10 mins",
    color: "bg-gray-400",
    hover: "hover:bg-gray-500",
    features: ["10 minutes watch time limit", "Priority support", "HD Quality"],
  },
  {
    name: "Gold",
    price: 100,
    watchTime: "Unlimited",
    color: "bg-yellow-500",
    hover: "hover:bg-yellow-600",
    features: ["Unlimited watch time", "24/7 support", "4K Quality", "Unlimited Downloads"],
  },
];

export default function PremiumDialog({ isOpen, onClose, onSuccess }: PremiumDialogProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const { user } = useAuth() as any;

  useEffect(() => {
    // Load Razorpay script dynamically
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  if (!isOpen) return null;

  const handleUpgrade = async (planName: string) => {
    if (!user) {
      setError("Please login first");
      return;
    }

    setLoading(planName);
    setError("");

    try {
      // 1. If no Razorpay keys are provided, simulate the payment for demo purposes
      if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID === "test" || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID.includes("test")) {
        const verifyRes = await fetch(`/api/premium/verify-payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_payment_id: "skip_verify_for_test",
            razorpay_order_id: "test_order",
            razorpay_signature: "test_sig",
            userId: user?.id || user?._id || user?.uid || localStorage.getItem("currentUserId"),
            plan: planName,
            amount: planName === "Gold" ? 100 : planName === "Silver" ? 50 : 10,
          }),
        });
        
        const verifyData = await verifyRes.json();
        if (verifyRes.ok && verifyData.success) {
          if (onSuccess) onSuccess();
          onClose();
          // Reload to apply new limits
          window.location.reload();
        } else {
          setError("Demo upgrade failed");
        }
        return;
      }

      // 2. Create actual order
      const orderRes = await fetch(`/api/premium/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planName }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok) throw new Error(orderData.message || "Failed to create order");

      // 2. Initialize Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "YouTube Clone Premium",
        description: `Upgrade to ${planName} Plan`,
        order_id: orderData.id,
        handler: async function (response: any) {
          try {
            // 3. Verify Payment
            const verifyRes = await fetch(`/api/premium/verify-payment`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...response,
                userId: user?.id || user?._id || user?.uid || localStorage.getItem("currentUserId"),
                plan: planName,
                amount: orderData.amount / 100,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
              if (onSuccess) onSuccess();
              onClose();
              window.location.reload();
            } else {
              setError("Payment verification failed");
            }
          } catch (err: any) {
            setError(err.message || "Error verifying payment");
          }
        },
        prefill: {
          name: user.username || user.displayName || "User",
          email: user.email || "",
        },
        theme: {
          color: "#2563EB",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setError(response.error.description || "Payment failed");
        setLoading(null);
      });
      rzp.open();

    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      // We don't reset loading here because the Razorpay modal is overlaying
      // setLoading(null); 
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-500 to-purple-600 opacity-20 dark:opacity-10 pointer-events-none" />
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition z-10"
        >
          <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>

        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mx-auto flex items-center justify-center mb-6">
            <span className="text-3xl">✨</span>
          </div>
          
          <h2 className="text-3xl font-bold mb-2">Choose Your Premium Plan</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-lg mx-auto">
            Upgrade to enjoy extended watch times, better quality, and support your favorite creators!
          </p>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {PLANS.map((plan) => (
              <div key={plan.name} className="flex flex-col bg-gray-50 dark:bg-[#2a2a2a] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 hover:shadow-xl transition relative">
                {plan.name === "Gold" && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    RECOMMENDED
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-extrabold">₹{plan.price}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">/one-time</span>
                </div>
                
                <div className="mb-6 flex-1">
                  <p className="font-medium text-sm mb-3">Watch time: {plan.watchTime}</p>
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                        <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleUpgrade(plan.name)}
                  disabled={loading !== null}
                  className={`w-full text-white font-semibold py-3 rounded-xl transition disabled:opacity-70 flex items-center justify-center gap-2 ${plan.color} ${plan.hover}`}
                >
                  {loading === plan.name ? "Processing..." : `Get ${plan.name}`}
                </button>
              </div>
            ))}
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-8">
            Secure payment powered by Razorpay. An invoice will be sent to your email.
          </p>
        </div>
      </div>
    </div>
  );
}
