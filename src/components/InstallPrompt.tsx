"use client";

import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Listen for app installed
    const installedHandler = () => {
      setIsInstalled(true);
      setShowPrompt(false);
    };

    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem("pwa-prompt-dismissed", "true");
  };

  // Don't show if already dismissed, installed, or no prompt available
  if (
    isInstalled ||
    !showPrompt ||
    sessionStorage.getItem("pwa-prompt-dismissed")
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-background-elevated border border-border rounded-lg shadow-xl p-4 z-50">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-spotify-green rounded-lg flex items-center justify-center flex-shrink-0">
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-7 h-7 text-black"
          >
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white">Install App</h3>
          <p className="text-sm text-foreground-subdued mt-1">
            Install this app for offline listening and a better experience
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="w-8 h-8 flex items-center justify-center text-foreground-subdued hover:text-white transition-colors flex-shrink-0"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16">
            <path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z" />
          </svg>
        </button>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={handleDismiss}
          className="flex-1 py-2 px-4 text-sm font-semibold text-foreground-subdued hover:text-white transition-colors"
        >
          Not now
        </button>
        <button
          onClick={handleInstall}
          className="flex-1 py-2 px-4 bg-white text-black text-sm font-semibold rounded-full hover:scale-105 transition-transform"
        >
          Install
        </button>
      </div>
    </div>
  );
}
