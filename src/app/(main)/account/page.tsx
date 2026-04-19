"use client";

import { ReactNode } from "react";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";

export default function AccountPage() {
  const { toast } = useToast();
  const { signOut } = useAuth();

  const notAvailable = () => toast("Not available in this demo");

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      {/* Top row: Your plan + Join Premium */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-4">
        <div className="bg-[#1a1a1a] rounded-xl p-6 flex flex-col">
          <span className="self-start text-xs font-bold text-white bg-[#2a2a2a] px-2 py-1 rounded">Your plan</span>
          <h1 className="text-4xl md:text-5xl font-black text-white mt-4 mb-2 leading-tight">Spotify Free</h1>
          <div className="flex-1" />
          <div className="flex justify-end">
            <button
              onClick={notAvailable}
              className="px-6 py-2 border border-[#727272] rounded-full text-sm font-bold text-white hover:border-white hover:scale-[1.03] transition-all"
            >
              Explore plans
            </button>
          </div>
        </div>
        <button
          onClick={notAvailable}
          className="rounded-xl p-6 flex flex-col items-center justify-center gap-2 text-white font-bold hover:scale-[1.02] transition-transform"
          style={{ background: "linear-gradient(135deg, #4f28a5 0%, #8e1b9c 50%, #a91e89 100%)" }}
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h12l3 6-9 12L3 9l3-6z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 3l3 6h6l3-6M9 9l3 12 3-12" />
          </svg>
          <span>Join Premium</span>
        </button>
      </div>

      {/* Account */}
      <Section title="Account">
        <Row icon={<SpotifyIcon />} label="Manage your subscription" onClick={notAvailable} />
        <Row icon={<PencilIcon />} label="Edit personal info" onClick={notAvailable} />
        <Row icon={<RefreshIcon />} label="Recover playlists" onClick={notAvailable} />
        <Row icon={<HomeIcon />} label="Address" onClick={notAvailable} />
      </Section>

      {/* Payment */}
      <Section title="Payment">
        <Row icon={<ReceiptIcon />} label="Payment history" onClick={notAvailable} />
        <Row icon={<CardIcon />} label="Saved payment cards" onClick={notAvailable} />
        <Row icon={<TagIcon />} label="Redeem" onClick={notAvailable} />
      </Section>

      {/* Security and privacy */}
      <Section title="Security and privacy">
        <Row icon={<GridIcon />} label="Manage apps" onClick={notAvailable} />
        <Row icon={<BellIcon />} label="Notification settings" onClick={notAvailable} />
        <Row icon={<EyeIcon />} label="Account privacy" onClick={notAvailable} />
        <Row icon={<LoginListIcon />} label="Edit login methods" onClick={notAvailable} />
        <Row icon={<DeviceLockIcon />} label="Set device password" onClick={notAvailable} />
        <Row icon={<TrashIcon />} label="Close account" onClick={notAvailable} />
        <Row icon={<SignOutIcon />} label="Sign out everywhere" onClick={() => signOut()} />
      </Section>

      {/* Advertising */}
      <Section title="Advertising">
        <Row icon={<PencilIcon />} label="Ad preferences" onClick={notAvailable} />
      </Section>

      {/* Help */}
      <Section title="Help">
        <Row icon={<HelpIcon />} label="Spotify support" onClick={notAvailable} />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="bg-[#1a1a1a] rounded-xl p-4 md:p-5">
      <h2 className="text-lg md:text-xl font-extrabold text-white px-2 pt-1 pb-3">{title}</h2>
      <div className="flex flex-col">{children}</div>
    </section>
  );
}

function Row({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 px-2 py-2.5 rounded-md hover:bg-[#232323] transition-colors text-left group"
    >
      <span className="w-9 h-9 rounded-md bg-[#2a2a2a] flex items-center justify-center flex-shrink-0 text-[#d8d8d8]">
        {icon}
      </span>
      <span className="flex-1 text-sm md:text-base font-medium text-white truncate">{label}</span>
      <svg className="w-4 h-4 text-[#b3b3b3] flex-shrink-0" fill="currentColor" viewBox="0 0 16 16">
        <path d="M5.47 3.47a.75.75 0 011.06 0l4 4a.75.75 0 010 1.06l-4 4a.75.75 0 01-1.06-1.06L8.94 8 5.47 4.53a.75.75 0 010-1.06z" />
      </svg>
    </button>
  );
}

/* ────────── icons (16x16, currentColor) ────────── */

function SpotifyIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 1.5l3.5 3.5-9 9H2v-3.5l9-9z" />
      <path d="M9.5 3l3.5 3.5" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2.5v3.5H9.5" />
      <path d="M2.5 13.5V10H6" />
      <path d="M12.5 6a5 5 0 00-9-1.5M3.5 10a5 5 0 009 1.5" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 7l6-5 6 5v6.5a1 1 0 01-1 1h-3v-5H6v5H3a1 1 0 01-1-1V7z" />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 1.5h10v13l-2-1.5-1.5 1.5L8 13l-1.5 1.5L5 13l-2 1.5v-13z" />
      <path d="M5.5 5h5M5.5 7.5h5M5.5 10h3" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" />
      <path d="M1.5 6.5h13" />
      <path d="M4 10h3" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 1.5H14v5.5l-6.5 6.5a1 1 0 01-1.414 0L1.5 8.914a1 1 0 010-1.414L8.5 1.5z" />
      <circle cx="11" cy="5" r="1" fill="currentColor" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="5" height="5" rx="0.5" />
      <rect x="9" y="2" width="5" height="5" rx="0.5" />
      <rect x="2" y="9" width="5" height="5" rx="0.5" />
      <rect x="9" y="9" width="5" height="5" rx="0.5" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1.5v1" />
      <path d="M3 12h10l-1.5-2V7a3.5 3.5 0 00-7 0v3L3 12z" />
      <path d="M6.5 13.5a1.5 1.5 0 003 0" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 8s2.5-4.5 7-4.5S15 8 15 8s-2.5 4.5-7 4.5S1 8 1 8z" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  );
}

function LoginListIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="3" cy="4" r="1.25" />
      <circle cx="3" cy="8" r="1.25" />
      <circle cx="3" cy="12" r="1.25" />
      <path d="M6 4h8M6 8h5M6 12h6" />
    </svg>
  );
}

function DeviceLockIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="1.5" width="10" height="13" rx="1.5" />
      <rect x="6" y="6" width="4" height="3" rx="0.5" />
      <path d="M7 6V5a1 1 0 012 0v1" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 4h11" />
      <path d="M6 4V2.5h4V4" />
      <path d="M3.5 4l.75 9.5a1 1 0 001 1h5.5a1 1 0 001-1L12.5 4" />
      <path d="M6.5 7v5M9.5 7v5" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 8h10" />
      <path d="M9 5l3 3-3 3" />
      <path d="M12 2h2v12h-2" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M6.5 6a1.5 1.5 0 113 0c0 1-1.5 1.25-1.5 2.5" />
      <circle cx="8" cy="11.5" r="0.5" fill="currentColor" />
    </svg>
  );
}
