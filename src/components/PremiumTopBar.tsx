"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

export function PremiumTopBar() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const initial = (user?.email?.[0] || "U").toUpperCase();

  return (
    <header className="flex items-center justify-between px-6 md:px-10 h-16 bg-black">
      {/* Left: Spotify logo */}
      <Link href="/" className="flex items-center gap-2 text-white hover:opacity-90 transition-opacity">
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
        </svg>
        <span className="text-base font-bold tracking-tight">Spotify</span>
      </Link>

      {/* Right cluster */}
      <div className="flex items-center gap-6">
        <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-white">
          <Link href="/premium" className="hover:underline">Premium plans</Link>
          <button onClick={() => toast("Support is not available in this demo")} className="hover:underline">Support</button>
          <button onClick={() => toast("Download is not available in this demo")} className="hover:underline">Download</button>
        </nav>

        <span className="hidden md:block h-6 w-px bg-white/30" />

        <div ref={menuRef} className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 text-white hover:opacity-90"
          >
            <span className="w-8 h-8 rounded-full bg-[#535353] flex items-center justify-center text-xs font-bold">{initial}</span>
            <span className="text-sm font-bold hidden sm:inline">Profile</span>
            <svg className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} fill="currentColor" viewBox="0 0 16 16">
              <path d="M14 6l-6 6-6-6 1.41-1.41L8 9.17l4.59-4.58L14 6z" />
            </svg>
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-[#282828] rounded-md shadow-2xl py-1 z-50 ring-1 ring-white/5">
              <MenuItem label="Account" onClick={() => { setOpen(false); router.push("/account"); }} />
              <MenuItem label="Profile" onClick={() => { setOpen(false); router.push("/profile"); }} />
              <MenuItem label="Back to Spotify" onClick={() => { setOpen(false); router.push("/"); }} />
              <div className="my-1 border-t border-[#3e3e3e]" />
              <MenuItem label="Log out" onClick={() => { setOpen(false); signOut(); router.push("/login"); }} />
            </div>
          )}
        </div>

        <button
          onClick={() => toast("Demo only — no real checkout here")}
          className="h-10 px-5 rounded-full bg-[#ffd2d7] text-black text-sm font-bold hover:scale-[1.04] transition-transform whitespace-nowrap"
        >
          Renew subscription
        </button>
      </div>
    </header>
  );
}

function MenuItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2.5 text-sm text-[#b3b3b3] hover:text-white hover:bg-[#3e3e3e] transition-colors"
    >
      {label}
    </button>
  );
}
