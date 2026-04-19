"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";

export default function PaymentCardsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [adding, setAdding] = useState(false);

  return (
    <div className="max-w-2xl mx-auto px-6 pt-8 pb-16 relative">
      {/* Search bar */}
      <div className="flex justify-center mb-10">
        <div className="relative w-full max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b3b3b3]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search account or help articles"
            onFocus={(e) => { e.target.blur(); toast("Account search is not functional in this demo"); }}
            className="w-full h-10 bg-[#1a1a1a] rounded-md pl-10 pr-4 text-sm text-white placeholder-[#b3b3b3] focus:outline-none focus:ring-1 focus:ring-white/20"
          />
        </div>
      </div>

      {/* Back button floating on the left */}
      <button
        onClick={() => router.back()}
        className="absolute left-0 top-[100px] w-9 h-9 rounded-full bg-[#2a2a2a] flex items-center justify-center text-white hover:bg-[#3a3a3a] transition-colors"
        title="Back"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
          <path d="M10.53 12.53a.75.75 0 01-1.06 0l-4-4a.75.75 0 010-1.06l4-4a.75.75 0 111.06 1.06L7.06 8l3.47 3.47a.75.75 0 010 1.06z" />
        </svg>
      </button>

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-black text-white mb-3">Saved payment cards</h1>
        <p className="text-sm text-[#e4e4e4] leading-relaxed">
          Manage your payment details for one-time purchases. To manage payment details for your monthly subscription, go to{" "}
          <Link
            href="/account"
            className="underline font-semibold hover:text-white"
          >
            Account overview
          </Link>
          .
        </p>
      </div>

      {/* My cards */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-white">My cards</h2>
          <LockIcon />
        </div>

        {!adding ? (
          <div className="border border-[#2a2a2a] rounded-md px-4 py-3 flex items-center gap-3">
            <CardBrandIcon />
            <span className="text-[#b3b3b3] text-sm font-semibold tracking-wider">•••</span>
            <span className="text-white text-sm font-semibold">0000 | MM/YY</span>
            <div className="flex-1" />
            <button
              onClick={() => setAdding(true)}
              className="text-[#1ed760] font-bold text-sm hover:underline"
            >
              Add card
            </button>
          </div>
        ) : (
          <AddCardForm
            onCancel={() => setAdding(false)}
            onSave={() => { setAdding(false); toast("Card saved (demo only — no real charge)"); }}
          />
        )}
      </section>
    </div>
  );
}

function AddCardForm({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  return (
    <div className="border border-[#2a2a2a] rounded-md p-6">
      {/* Credit or debit card header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-bold text-white mb-3">Credit or debit card</p>
          <div className="flex items-center gap-2">
            <BrandTile label="VISA" bg="#ffffff" color="#1a1f71" italic bold />
            <BrandTile custom>
              <div className="flex items-center">
                <span className="w-5 h-5 rounded-full bg-[#eb001b]" />
                <span className="w-5 h-5 rounded-full bg-[#f79e1b] -ml-2 mix-blend-multiply" />
              </div>
            </BrandTile>
            <BrandTile bg="#006fcf" color="#ffffff" label="AMERICAN" sublabel="EXPRESS" stacked />
            <BrandTile custom>
              <div className="flex flex-col items-center">
                <span className="text-[6px] font-bold text-white tracking-wider">DISCOVER</span>
                <span className="w-full h-3 -mt-0.5 rounded-sm" style={{ background: "linear-gradient(90deg, transparent 40%, #ff6000 40%, #ff6000 80%, transparent 80%)" }} />
                <span className="text-[5px] font-bold text-[#b3b3b3] tracking-wider mt-0.5">NETWORK</span>
              </div>
            </BrandTile>
          </div>
        </div>
        <LockIcon />
      </div>

      {/* Card number */}
      <label className="block text-sm font-bold text-white mt-4 mb-2">Card number</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-5 rounded bg-[#2a2a2a] border border-[#3a3a3a] flex items-center justify-center">
          <svg className="w-3.5 h-3" fill="none" stroke="#e4e4e4" strokeWidth="1.5" viewBox="0 0 24 16">
            <rect x="1" y="1" width="22" height="14" rx="2" />
            <line x1="5" y1="11" x2="10" y2="11" />
          </svg>
        </span>
        <input
          type="text"
          value={number}
          onChange={(e) => setNumber(e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim())}
          placeholder="0000 0000 0000 0000"
          className="w-full h-12 bg-transparent border border-[#2a2a2a] rounded-md pl-14 pr-4 text-white placeholder-[#5a5a5a] focus:outline-none focus:border-white/50"
        />
      </div>

      {/* Expiry + Security */}
      <div className="grid grid-cols-2 gap-4 mt-5">
        <div>
          <label className="block text-sm font-bold text-white mb-2">Expiry date</label>
          <input
            type="text"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value.replace(/\D/g, "").slice(0, 4).replace(/(\d{2})(\d{1,2})?/, (_, a, b) => b ? `${a} / ${b}` : a))}
            placeholder="MM / YY"
            className="w-full h-12 bg-transparent border border-[#2a2a2a] rounded-md px-4 text-white placeholder-[#5a5a5a] focus:outline-none focus:border-white/50"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-white mb-2">Security code</label>
          <div className="relative">
            <input
              type="text"
              value={cvc}
              onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="w-full h-12 bg-transparent border border-[#2a2a2a] rounded-md px-4 pr-10 text-white placeholder-[#5a5a5a] focus:outline-none focus:border-white/50"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border border-[#6a6a6a] text-[#b3b3b3] flex items-center justify-center text-xs hover:text-white hover:border-white transition-colors"
              title="The 3 or 4 digit code on the back of your card"
            >
              ?
            </button>
          </div>
        </div>
      </div>

      {/* Consent */}
      <p className="text-sm text-white mt-6 leading-relaxed">
        By completing your purchase, you consent to Spotify storing your payment method for future charges, subscriptions and one-time-purchases. You can change your payment method at any time in your account settings.
      </p>

      {/* Save */}
      <div className="flex flex-col items-center gap-4 mt-8">
        <button
          onClick={onSave}
          className="h-12 px-14 rounded-full bg-[#1ed760] text-black font-bold text-base hover:scale-[1.04] transition-transform"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="text-white font-bold text-sm hover:underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function BrandTile({
  bg,
  color,
  label,
  sublabel,
  italic,
  bold,
  stacked,
  custom,
  children,
}: {
  bg?: string;
  color?: string;
  label?: string;
  sublabel?: string;
  italic?: boolean;
  bold?: boolean;
  stacked?: boolean;
  custom?: boolean;
  children?: React.ReactNode;
}) {
  if (custom) {
    return (
      <div className="w-10 h-6 rounded bg-white flex items-center justify-center overflow-hidden">
        {children}
      </div>
    );
  }
  return (
    <div
      className={`w-10 h-6 rounded flex items-center justify-center overflow-hidden ${stacked ? "flex-col leading-[0.9]" : ""}`}
      style={{ background: bg }}
    >
      <span
        className={`text-[8px] ${bold ? "font-black" : "font-bold"} ${italic ? "italic" : ""}`}
        style={{ color }}
      >
        {label}
      </span>
      {sublabel && (
        <span className={`text-[6px] ${bold ? "font-black" : "font-bold"} ${italic ? "italic" : ""}`} style={{ color }}>
          {sublabel}
        </span>
      )}
    </div>
  );
}

function LockIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <rect x="5" y="11" width="14" height="10" rx="1.5" />
      <path d="M8 11V7a4 4 0 118 0v4" />
    </svg>
  );
}

function CardBrandIcon() {
  return (
    <span className="w-7 h-5 rounded bg-[#2a2a2a] border border-[#3a3a3a] flex items-center justify-center">
      <svg className="w-3.5 h-3" fill="none" stroke="#e4e4e4" strokeWidth="1.5" viewBox="0 0 24 16">
        <rect x="1" y="1" width="22" height="14" rx="2" />
        <line x1="5" y1="11" x2="10" y2="11" />
      </svg>
    </span>
  );
}
