"use client";

import { useToast } from "@/hooks/useToast";

interface ConnectPopupProps {
  onClose: () => void;
}

export function ConnectPopup({ onClose }: ConnectPopupProps) {
  const { toast } = useToast();
  return (
    <div className="absolute bottom-full right-0 mb-2 w-80 bg-[#282828] rounded-lg shadow-2xl z-50 overflow-hidden">
      <div className="p-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Connect</h3>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-foreground-subdued hover:text-white">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z" /></svg>
        </button>
      </div>

      {/* Current device */}
      <div className="mx-4 mb-4 p-3 bg-background-tinted rounded-lg border border-spotify-green/30">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-spotify-green flex-shrink-0" fill="currentColor" viewBox="0 0 16 16">
            <path d="M1 4.75A3.75 3.75 0 014.75 1h6.5A3.75 3.75 0 0115 4.75v4.5A3.75 3.75 0 0111.25 13h-1v1.5h1a.75.75 0 010 1.5h-6.5a.75.75 0 010-1.5h1V13h-1A3.75 3.75 0 011 9.25v-4.5zm3.75-2.25A2.25 2.25 0 002.5 4.75v4.5a2.25 2.25 0 002.25 2.25h6.5a2.25 2.25 0 002.25-2.25v-4.5a2.25 2.25 0 00-2.25-2.25h-6.5z" />
          </svg>
          <span className="text-sm font-semibold text-spotify-green">This web browser</span>
        </div>
      </div>

      <div className="px-4 pb-2">
        <p className="text-sm font-bold text-white mb-4">No other devices found</p>
      </div>

      <div className="px-4 pb-4 space-y-4">
        <div className="flex items-center gap-3">
          <svg className="w-8 h-8 text-foreground-subdued flex-shrink-0" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 1a5 5 0 00-3.427 8.655A5.982 5.982 0 002.01 14H1.5a.5.5 0 000 1h13a.5.5 0 000-1h-.51a5.982 5.982 0 00-2.563-4.345A5 5 0 008 1zm0 1.5a3.5 3.5 0 110 7 3.5 3.5 0 010-7z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-white">Check your WiFi</p>
            <p className="text-xs text-foreground-subdued">Connect the devices you&apos;re using to the same WiFi.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <svg className="w-8 h-8 text-foreground-subdued flex-shrink-0" fill="currentColor" viewBox="0 0 16 16">
            <path d="M1 4.75A3.75 3.75 0 014.75 1h6.5A3.75 3.75 0 0115 4.75v4.5A3.75 3.75 0 0111.25 13h-1v1.5h1a.75.75 0 010 1.5h-6.5a.75.75 0 010-1.5h1V13h-1A3.75 3.75 0 011 9.25v-4.5zm3.75-2.25A2.25 2.25 0 002.5 4.75v4.5a2.25 2.25 0 002.25 2.25h6.5a2.25 2.25 0 002.25-2.25v-4.5a2.25 2.25 0 00-2.25-2.25h-6.5z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-white">Play from another device</p>
            <p className="text-xs text-foreground-subdued">It will automatically appear here.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <svg className="w-8 h-8 text-foreground-subdued flex-shrink-0" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 1a.75.75 0 01.75.75v6.69l2.72-2.72a.75.75 0 011.06 1.06l-4 4a.75.75 0 01-1.06 0l-4-4a.75.75 0 011.06-1.06l2.72 2.72V1.75A.75.75 0 018 1zM1.75 12a.75.75 0 01.75.75v1.5h11v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 0113.25 16H2.75A1.75 1.75 0 011 14.25v-1.5a.75.75 0 01.75-.75z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-white">Switch to the Spotify app</p>
            <p className="text-xs text-foreground-subdued">The app can detect more devices.</p>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
        <div className="flex items-center justify-between cursor-pointer hover:text-white transition-colors" onClick={() => toast("Help articles are not available")}>
          <span className="text-sm text-foreground-subdued">Don&apos;t see your device?</span>
          <svg className="w-4 h-4 text-foreground-subdued" fill="currentColor" viewBox="0 0 16 16"><path d="M1 2.75A.75.75 0 011.75 2H7v1.5H2.5v10h10V9H14v5.25a.75.75 0 01-.75.75H1.75a.75.75 0 01-.75-.75V2.75z" /><path d="M15 1.5H10V0h5.25a.75.75 0 01.75.75V6h-1.5V2.56l-5.22 5.22-1.06-1.06L13.44 1.5z" /></svg>
        </div>
        <div className="flex items-center justify-between cursor-pointer hover:text-white transition-colors" onClick={() => toast("Help articles are not available")}>
          <span className="text-sm text-foreground-subdued">What can I connect to?</span>
          <svg className="w-4 h-4 text-foreground-subdued" fill="currentColor" viewBox="0 0 16 16"><path d="M1 2.75A.75.75 0 011.75 2H7v1.5H2.5v10h10V9H14v5.25a.75.75 0 01-.75.75H1.75a.75.75 0 01-.75-.75V2.75z" /><path d="M15 1.5H10V0h5.25a.75.75 0 01.75.75V6h-1.5V2.56l-5.22 5.22-1.06-1.06L13.44 1.5z" /></svg>
        </div>
      </div>
    </div>
  );
}
