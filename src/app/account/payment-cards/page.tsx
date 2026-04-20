"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";

const STORAGE_KEY = "spotify_saved_cards";
const CARDS_EVENT = "saved-cards-changed";

type SavedCard = {
  id: string;
  name: string;
  first4: string;
  last4: string;
  expiry: string; // "MM / YY"
  brand: string;
};

function readCards(): SavedCard[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (c): c is SavedCard =>
        c &&
        typeof c === "object" &&
        typeof c.id === "string" &&
        typeof c.name === "string" &&
        typeof c.first4 === "string" &&
        typeof c.last4 === "string" &&
        typeof c.expiry === "string" &&
        typeof c.brand === "string"
    );
  } catch {
    return [];
  }
}

function writeCards(cards: SavedCard[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    window.dispatchEvent(new Event(CARDS_EVENT));
  } catch {
    // ignore
  }
}

function subscribeCards(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(CARDS_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CARDS_EVENT, callback);
  };
}

// Cache the last read result so useSyncExternalStore has a stable snapshot.
let cardsCache: SavedCard[] = [];
let cardsCacheKey = "";
function getCardsSnapshot(): SavedCard[] {
  if (typeof window === "undefined") return cardsCache;
  const raw = window.localStorage.getItem(STORAGE_KEY) ?? "";
  if (raw !== cardsCacheKey) {
    cardsCacheKey = raw;
    cardsCache = readCards();
  }
  return cardsCache;
}
function getServerSnapshot(): SavedCard[] {
  return [];
}

function detectBrand(digitsOnly: string): string {
  if (/^4/.test(digitsOnly)) return "Visa";
  if (/^(5[1-5]|2(2[2-9]|[3-6]|7[0-1]|720))/.test(digitsOnly)) return "Mastercard";
  if (/^3[47]/.test(digitsOnly)) return "American Express";
  if (/^(6011|65|64[4-9])/.test(digitsOnly)) return "Discover";
  return "Card";
}

export default function PaymentCardsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const cards = useSyncExternalStore(subscribeCards, getCardsSnapshot, getServerSnapshot);

  const handleSave = useCallback(
    (card: Omit<SavedCard, "id">) => {
      const next: SavedCard[] = [
        ...getCardsSnapshot(),
        { ...card, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` },
      ];
      writeCards(next);
      setAdding(false);
      toast("Card saved (demo only — no real charge)");
    },
    [toast]
  );

  const handleRemove = useCallback(
    (id: string) => {
      const next = getCardsSnapshot().filter((c) => c.id !== id);
      writeCards(next);
      toast("Card removed");
    },
    [toast]
  );

  return (
    <div className="relative pt-8 pb-16 px-6">
      {/* Back button: pinned to viewport left, never overlaps content */}
      <button
        onClick={() => router.back()}
        className="hidden md:flex absolute left-6 top-[100px] w-9 h-9 rounded-full bg-[#2a2a2a] items-center justify-center text-white hover:bg-[#3a3a3a] transition-colors z-10"
        title="Back"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
          <path d="M10.53 12.53a.75.75 0 01-1.06 0l-4-4a.75.75 0 010-1.06l4-4a.75.75 0 111.06 1.06L7.06 8l3.47 3.47a.75.75 0 010 1.06z" />
        </svg>
      </button>

      <div className="max-w-2xl mx-auto">
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

        {/* Inline back button for narrow viewports */}
        <button
          onClick={() => router.back()}
          className="md:hidden mb-4 inline-flex w-9 h-9 rounded-full bg-[#2a2a2a] items-center justify-center text-white hover:bg-[#3a3a3a] transition-colors"
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

        <div className="space-y-2">
          {cards.map((card) => (
            <div
              key={card.id}
              className="border border-[#2a2a2a] rounded-md px-4 py-3 flex items-center gap-3"
            >
              <CardBrandIcon />
              <span className="text-white text-sm font-semibold tracking-wider">
                {card.first4} •••• •••• {card.last4}
              </span>
              <span className="text-[#b3b3b3] text-sm">|</span>
              <span className="text-white text-sm font-semibold">{card.expiry}</span>
              <span className="text-[#b3b3b3] text-sm truncate">{card.name}</span>
              <div className="flex-1" />
              <button
                onClick={() => handleRemove(card.id)}
                className="text-[#b3b3b3] hover:text-white text-xs font-semibold"
              >
                Remove
              </button>
            </div>
          ))}

          {!adding ? (
            <button
              onClick={() => setAdding(true)}
              className="w-full border border-dashed border-[#2a2a2a] rounded-md px-4 py-3 flex items-center gap-3 text-left hover:border-[#3a3a3a] transition-colors"
            >
              <CardBrandIcon />
              <span className="text-[#b3b3b3] text-sm font-semibold tracking-wider">•••</span>
              <span className="text-white text-sm font-semibold">0000 | MM/YY</span>
              <div className="flex-1" />
              <span className="text-[#1ed760] font-bold text-sm hover:underline">
                Add card
              </span>
            </button>
          ) : (
            <AddCardForm
              onCancel={() => setAdding(false)}
              onSave={handleSave}
            />
          )}
        </div>
      </section>
      </div>
    </div>
  );
}

type ValidationState = {
  number: string | null;
  expiry: string | null;
  cvc: string | null;
  name: string | null;
};

function validateExpiry(expiry: string): string | null {
  // expected format "MM / YY" (possibly partial)
  const match = expiry.match(/^(\d{2})\s*\/\s*(\d{2})$/);
  if (!match) return "Enter expiry as MM / YY";
  const month = parseInt(match[1], 10);
  const year = parseInt(match[2], 10);
  if (isNaN(month) || month < 1 || month > 12) return "Invalid month";
  // Compare against today's YY/MM (assume 20YY)
  const now = new Date();
  const curYear = now.getFullYear() % 100;
  const curMonth = now.getMonth() + 1;
  if (year < curYear || (year === curYear && month < curMonth)) return "Card is expired";
  return null;
}

function AddCardForm({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (card: { name: string; first4: string; last4: string; expiry: string; brand: string }) => void;
}) {
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [attempted, setAttempted] = useState(false);

  const digits = number.replace(/\D/g, "");
  const errors: ValidationState = {
    number: digits.length < 13 || digits.length > 19 ? "Enter a 13–19 digit card number" : null,
    expiry: validateExpiry(expiry),
    cvc: cvc.length < 3 || cvc.length > 4 ? "Enter a 3 or 4 digit security code" : null,
    name: name.trim().length < 2 ? "Enter the cardholder name" : null,
  };
  const isValid = !errors.number && !errors.expiry && !errors.cvc && !errors.name;

  const showError = (field: keyof ValidationState) => attempted && errors[field];

  const handleSaveClick = () => {
    setAttempted(true);
    if (!isValid) return;
    onSave({
      name: name.trim(),
      first4: digits.slice(0, 4),
      last4: digits.slice(-4),
      expiry,
      brand: detectBrand(digits),
    });
  };

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
          inputMode="numeric"
          autoComplete="cc-number"
          value={number}
          onChange={(e) => setNumber(e.target.value.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim())}
          placeholder="0000 0000 0000 0000"
          className={`w-full h-12 bg-transparent border rounded-md pl-14 pr-4 text-white placeholder-[#5a5a5a] focus:outline-none ${
            showError("number") ? "border-[#e22134] focus:border-[#e22134]" : "border-[#2a2a2a] focus:border-white/50"
          }`}
        />
      </div>
      {showError("number") && <p className="mt-1 text-xs text-[#e22134]">{errors.number}</p>}

      {/* Cardholder name */}
      <label className="block text-sm font-bold text-white mt-5 mb-2">Cardholder name</label>
      <input
        type="text"
        autoComplete="cc-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name on card"
        className={`w-full h-12 bg-transparent border rounded-md px-4 text-white placeholder-[#5a5a5a] focus:outline-none ${
          showError("name") ? "border-[#e22134] focus:border-[#e22134]" : "border-[#2a2a2a] focus:border-white/50"
        }`}
      />
      {showError("name") && <p className="mt-1 text-xs text-[#e22134]">{errors.name}</p>}

      {/* Expiry + Security */}
      <div className="grid grid-cols-2 gap-4 mt-5">
        <div>
          <label className="block text-sm font-bold text-white mb-2">Expiry date</label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="cc-exp"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value.replace(/\D/g, "").slice(0, 4).replace(/(\d{2})(\d{1,2})?/, (_, a, b) => b ? `${a} / ${b}` : a))}
            placeholder="MM / YY"
            className={`w-full h-12 bg-transparent border rounded-md px-4 text-white placeholder-[#5a5a5a] focus:outline-none ${
              showError("expiry") ? "border-[#e22134] focus:border-[#e22134]" : "border-[#2a2a2a] focus:border-white/50"
            }`}
          />
          {showError("expiry") && <p className="mt-1 text-xs text-[#e22134]">{errors.expiry}</p>}
        </div>
        <div>
          <label className="block text-sm font-bold text-white mb-2">Security code</label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="cc-csc"
              value={cvc}
              onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className={`w-full h-12 bg-transparent border rounded-md px-4 pr-10 text-white placeholder-[#5a5a5a] focus:outline-none ${
                showError("cvc") ? "border-[#e22134] focus:border-[#e22134]" : "border-[#2a2a2a] focus:border-white/50"
              }`}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border border-[#6a6a6a] text-[#b3b3b3] flex items-center justify-center text-xs hover:text-white hover:border-white transition-colors"
              title="The 3 or 4 digit code on the back of your card"
            >
              ?
            </button>
          </div>
          {showError("cvc") && <p className="mt-1 text-xs text-[#e22134]">{errors.cvc}</p>}
        </div>
      </div>

      {/* Consent */}
      <p className="text-sm text-white mt-6 leading-relaxed">
        By completing your purchase, you consent to Spotify storing your payment method for future charges, subscriptions and one-time-purchases. You can change your payment method at any time in your account settings.
      </p>

      {/* Save */}
      <div className="flex flex-col items-center gap-4 mt-8">
        <button
          onClick={handleSaveClick}
          disabled={!isValid}
          aria-disabled={!isValid}
          className={`h-12 px-14 rounded-full font-bold text-base transition-transform ${
            isValid
              ? "bg-[#1ed760] text-black hover:scale-[1.04]"
              : "bg-[#2a2a2a] text-[#6a6a6a] cursor-not-allowed"
          }`}
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
