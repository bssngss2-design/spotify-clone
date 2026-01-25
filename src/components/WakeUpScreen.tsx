"use client";

import { useState, useEffect } from "react";

export function WakeUpScreen({ children }: { children: React.ReactNode }) {
  const [isWakingUp, setIsWakingUp] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Try to ping the API to see if server is awake
    const checkServer = async () => {
      const start = Date.now();
      
      try {
        // Simple fetch to check if server responds
        await fetch("/api/health", { 
          method: "HEAD",
          cache: "no-store" 
        });
        
        const elapsed = Date.now() - start;
        
        // If it took more than 2 seconds, server was probably cold
        if (elapsed > 2000) {
          // Brief delay to ensure everything is ready
          setTimeout(() => {
            setIsWakingUp(false);
            setShowContent(true);
          }, 500);
        } else {
          // Server was already warm
          setIsWakingUp(false);
          setShowContent(true);
        }
      } catch {
        // If fetch fails, still show content after a delay
        setTimeout(() => {
          setIsWakingUp(false);
          setShowContent(true);
        }, 1000);
      }
    };

    checkServer();
  }, []);

  // Count up seconds while waking
  useEffect(() => {
    if (!isWakingUp) return;
    
    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isWakingUp]);

  if (showContent) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
      {/* Logo */}
      <div className="relative">
        <svg
          viewBox="0 0 24 24"
          className="w-20 h-20 text-green-500 animate-pulse"
          fill="currentColor"
        >
          <circle cx="12" cy="12" r="10" />
          <line
            x1="6"
            y1="6"
            x2="18"
            y2="18"
            stroke="black"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Text */}
      <div className="text-center">
        <h1 className="text-white text-xl font-semibold mb-2">
          Waking up the server...
        </h1>
        <p className="text-zinc-400 text-sm">
          Free tier problems 😴 • {seconds}s
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-64 h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-green-500 animate-pulse"
          style={{ 
            width: `${Math.min(seconds * 2, 95)}%`,
            transition: "width 1s linear"
          }}
        />
      </div>

      <p className="text-zinc-500 text-xs mt-4">
        Usually takes 30-60 seconds after inactivity
      </p>
    </div>
  );
}
