"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

export function TopBar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navigateSearch = useCallback((value: string) => {
    if (value.trim()) {
      router.push(`/search?q=${encodeURIComponent(value.trim())}`);
    } else if (pathname === "/search") {
      router.push("/");
    }
  }, [router, pathname]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => navigateSearch(value), 400);
  };

  const handleSearchSubmit = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      navigateSearch(searchQuery);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (pathname === "/search") router.push("/");
  };

  const userInitial = user?.email?.charAt(0).toUpperCase() || "U";

  const isHome = pathname === "/";

  return (
    <div className="h-16 bg-black flex items-center justify-between gap-4 px-4 flex-shrink-0">
      {/* Left: Spotify logo */}
      <div className="flex items-center flex-shrink-0">
        <Link href="/" aria-label="Spotify home">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
        </Link>
      </div>

      {/* Center: Home button + Search bar */}
      <div className="flex items-center gap-2 flex-1 max-w-[546px] min-w-0">
        <Link
          href="/"
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-background-tinted hover:bg-background-highlight transition-colors"
          title="Home"
        >
          {isHome ? (
            // Filled home icon
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.5 3.247a1 1 0 00-1 0L4 7.577V20h4.5v-6a1 1 0 011-1h5a1 1 0 011 1v6H20V7.577l-7.5-4.33z" />
            </svg>
          ) : (
            // Outlined home icon
            <svg className="w-6 h-6 text-foreground-subdued hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.5 3.247a1 1 0 00-1 0L4 7.577V20h4.5v-6a1 1 0 011-1h5a1 1 0 011 1v6H20V7.577l-7.5-4.33zm-2-1.732a3 3 0 013 0l7.5 4.33a2 2 0 011 1.732V21a1 1 0 01-1 1h-6.5a1 1 0 01-1-1v-6h-3v6a1 1 0 01-1 1H3a1 1 0 01-1-1V7.577a2 2 0 011-1.732l7.5-4.33z" />
            </svg>
          )}
        </Link>

        <div className={`w-full max-w-[474px] relative flex items-center rounded-full transition-all h-12 ${
          searchFocused ? "bg-[#2a2a2a] ring-2 ring-white" : "bg-[#1f1f1f] hover:bg-[#2a2a2a]"
        }`}>
          <div className="pl-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-foreground-subdued" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10.533 1.279c-5.18 0-9.407 4.14-9.407 9.279s4.226 9.279 9.407 9.279c2.234 0 4.29-.77 5.907-2.058l4.353 4.353a1 1 0 101.414-1.414l-4.344-4.344a9.157 9.157 0 002.077-5.816c0-5.14-4.226-9.28-9.407-9.28zm-7.407 9.28c0-4.006 3.302-7.28 7.407-7.28s7.407 3.274 7.407 7.28-3.302 7.279-7.407 7.279-7.407-3.273-7.407-7.28z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleSearchSubmit}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="What do you want to play?"
            className="flex-1 min-w-0 bg-transparent text-sm text-white placeholder-foreground-subdued px-3 py-3 outline-none"
          />
          {searchQuery && (
            <button onClick={clearSearch} className="pr-3 text-foreground-subdued hover:text-white">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5.636 5.636a1 1 0 011.414 0L12 10.586l4.95-4.95a1 1 0 111.414 1.414L13.414 12l4.95 4.95a1 1 0 01-1.414 1.414L12 13.414l-4.95 4.95a1 1 0 01-1.414-1.414L10.586 12 5.636 7.05a1 1 0 010-1.414z" />
              </svg>
            </button>
          )}
          {!searchQuery && (
            <Link
              href="/search"
              title="Browse all"
              className="pr-3 border-l border-[#535353] pl-3 flex items-center"
            >
              <svg className="w-5 h-5 text-foreground-subdued hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15 15.5c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM1 4.75A3.75 3.75 0 014.75 1h14.5A3.75 3.75 0 0123 4.75v14.5A3.75 3.75 0 0119.25 23H4.75A3.75 3.75 0 011 19.25V4.75zm3.75-2.25A2.25 2.25 0 002.5 4.75v14.5a2.25 2.25 0 002.25 2.25h14.5a2.25 2.25 0 002.25-2.25V4.75a2.25 2.25 0 00-2.25-2.25H4.75z" />
              </svg>
            </Link>
          )}
        </div>
      </div>

      {/* Right: upsells + action buttons + profile */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => toast("Premium landing page not available yet")}
          className="hidden xl:inline-flex items-center px-4 h-8 rounded-full text-sm font-bold bg-white text-black hover:scale-105 transition-transform whitespace-nowrap"
        >
          Explore Premium
        </button>

        <button
          onClick={() => toast("Install App not available yet")}
          className="hidden md:inline-flex items-center gap-2 h-8 px-3 rounded-full bg-black border border-transparent text-sm font-semibold text-foreground-subdued hover:text-white hover:scale-105 transition-all whitespace-nowrap"
          title="Install the Spotify desktop app"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
            <path d="M7.25 1.25a.75.75 0 011.5 0V8.7l1.97-1.97a.75.75 0 111.06 1.06l-3.25 3.25a.75.75 0 01-1.06 0L4.22 7.79a.75.75 0 011.06-1.06L7.25 8.7V1.25zM1.75 11.5a.75.75 0 01.75.75V14h11v-1.75a.75.75 0 011.5 0v2.25A1.25 1.25 0 0113.75 15.75H2.25A1.25 1.25 0 011 14.5v-2.25a.75.75 0 01.75-.75z" />
          </svg>
          Install App
        </button>

        <button onClick={() => toast("What's New is not available yet")} className="w-8 h-8 rounded-full flex items-center justify-center text-foreground-subdued hover:text-white hover:scale-105 transition-all" title="What's New">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 1.5a4.492 4.492 0 00-4.482 4.199 23.656 23.656 0 01-.964 4.588l-.354 1.103H13.8l-.354-1.103a23.657 23.657 0 01-.964-4.588A4.492 4.492 0 008 1.5zM0 11.388l.65-2.025a21.655 21.655 0 00.882-4.203A6.492 6.492 0 018 0a6.492 6.492 0 016.468 5.16 21.656 21.656 0 00.882 4.203l.65 2.025H0zm5 2.112a3 3 0 106 0H5z" />
          </svg>
        </button>

        <button onClick={() => toast("Friend Activity is not available yet")} className="w-8 h-8 rounded-full flex items-center justify-center text-foreground-subdued hover:text-white hover:scale-105 transition-all" title="Friend Activity">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
            <path d="M4.5 2a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM3 5.5a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm8.5-3.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM10 4.5a1.5 1.5 0 113.001.001A1.5 1.5 0 0110 4.5zM1 14a3.5 3.5 0 013.5-3.5h.382a4.97 4.97 0 00-.382 1.921V14H1zm5.5 0v-1.579A3.421 3.421 0 019.921 9h1.658A3.421 3.421 0 0115 12.421V14H6.5z" />
          </svg>
        </button>

        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              profileOpen ? "bg-[#1a1a1a] text-white ring-2 ring-white" : "bg-[#535353] text-white hover:scale-105"
            }`}
            title={user?.email || "Profile"}
          >
            {userInitial}
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-[#282828] rounded-md shadow-2xl py-1 z-50 ring-1 ring-white/5">
              <div className="px-3 py-2.5 border-b border-[#3e3e3e]">
                <p className="text-xs text-foreground-subdued uppercase tracking-wider">Signed in as</p>
                <p className="text-sm text-white font-medium truncate">{user?.email}</p>
              </div>

              <ProfileMenuItem
                label="Account"
                external
                onClick={() => { setProfileOpen(false); router.push("/account"); }}
              />
              <ProfileMenuItem
                label="Profile"
                onClick={() => { setProfileOpen(false); router.push("/profile"); }}
              />
              <ProfileMenuItem
                label="Recents"
                onClick={() => { setProfileOpen(false); router.push("/recents"); }}
              />
              <ProfileMenuItem
                label="Upgrade to Premium"
                external
                onClick={() => { setProfileOpen(false); toast("Premium landing page not available yet"); }}
              />
              <ProfileMenuItem
                label="Support"
                external
                onClick={() => { setProfileOpen(false); toast("Support page not available in this demo"); }}
              />
              <ProfileMenuItem
                label="Download"
                external
                onClick={() => { setProfileOpen(false); toast("Install App not available yet"); }}
              />
              <ProfileMenuItem
                label="Settings"
                onClick={() => { setProfileOpen(false); toast("Settings page not available in this demo"); }}
              />

              <div className="my-1 border-t border-[#3e3e3e]" />

              <ProfileMenuItem
                label="Log out"
                onClick={() => { setProfileOpen(false); signOut(); }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileMenuItem({
  label,
  onClick,
  external,
  rightBadge,
}: {
  label: string;
  onClick: () => void;
  external?: boolean;
  rightBadge?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-foreground-subdued hover:text-white hover:bg-[#3e3e3e] transition-colors text-left"
    >
      <span className="truncate">{label}</span>
      {rightBadge ?? (external ? (
        <svg className="w-3.5 h-3.5 flex-shrink-0 ml-2 opacity-70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 14L21 3m0 0h-7m7 0v7M21 14v5a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h5" />
        </svg>
      ) : null)}
    </button>
  );
}
