"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type ThemeContextType = {
  theme: "light" | "dark";
};

const ThemeContext = createContext<ThemeContextType>({ theme: "dark" });

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const applyDynamicTheme = async () => {
      try {
        // Fetch location data from a free IP Geolocation API
        const response = await fetch("https://ipapi.co/json/");
        const data = await response.json();
        
        const region = data.region;
        const southernStates = [
          "Tamil Nadu", 
          "Kerala", 
          "Karnataka", 
          "Andhra Pradesh", 
          "Telangana"
        ];
        
        // Get current time in IST (Asia/Kolkata timezone)
        const dateString = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
        const istDate = new Date(dateString);
        const hours = istDate.getHours();
        
        // Check if between 10:00 AM (10) and 12:00 PM (11:59)
        const isTimeWindow = hours >= 10 && hours < 12;
        const isSouthIndia = southernStates.includes(region);
        
        if (isTimeWindow && isSouthIndia) {
          setTheme("light");
          document.documentElement.classList.remove("dark");
        } else {
          setTheme("dark");
          document.documentElement.classList.add("dark");
        }
      } catch (error) {
        // Silently fallback to dark theme on error (e.g. adblocker blocking ipapi)
        setTheme("dark");
        document.documentElement.classList.add("dark");
      }
    };

    applyDynamicTheme();
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  );
}
