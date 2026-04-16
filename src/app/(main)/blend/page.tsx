"use client";

import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

export default function BlendPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const initial = user?.email?.charAt(0).toUpperCase() || "B";

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      {/* Two overlapping circles */}
      <div className="flex items-center -space-x-6 mb-8">
        {/* User avatar */}
        <div className="w-32 h-32 rounded-full bg-[#535353] flex items-center justify-center text-4xl font-bold text-white border-4 border-[#121212] z-10">
          {initial}
        </div>
        {/* Add friend circle */}
        <div className="w-32 h-32 rounded-full bg-[#3e3e3e] flex items-center justify-center border-4 border-[#121212]">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
          </svg>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-white mb-3">Invite friends</h1>
      <p className="text-sm text-[#b3b3b3] text-center max-w-sm mb-8 leading-relaxed">
        Pick a friend to create a Blend with—a playlist that shows how your music taste matches up.
      </p>

      <button
        onClick={() => toast("Invites are not available yet")}
        className="px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform"
      >
        Invite
      </button>
    </div>
  );
}
