"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useToast } from "@/hooks/useToast";

const ROTATING_WORDS = ["music", "artists", "fans", "live events", "video"];

export default function PremiumPage() {
  const { toast } = useToast();
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setWordIndex((i) => (i + 1) % ROTATING_WORDS.length);
    }, 1500);
    return () => clearInterval(id);
  }, []);

  const currentWord = ROTATING_WORDS[wordIndex];

  return (
    <div className="bg-black text-white">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 md:px-12 lg:px-20 pt-10 pb-16 min-h-[88vh]">
        {/* Giant cream Spotify logo — responsive, vertically centered, sits BEHIND text and overlaps into "for" */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 -translate-y-1/2 right-[-10%] sm:right-[-6%] md:right-[-4%] lg:right-[-2%] aspect-square opacity-90 z-0"
          style={{ width: "min(105vh, 78vw)" }}
        >
          <svg viewBox="0 0 168 168" className="w-full h-full">
            <circle cx="84" cy="84" r="84" fill="#f5f0e1" />
            <path
              d="M119.7 120.1c-1.5 2.4-4.6 3.2-7 1.7-19.2-11.7-43.3-14.4-71.7-7.9-2.8.6-5.5-1.1-6.1-3.9-.6-2.8 1.1-5.5 3.9-6.1 31-7 57.7-3.9 79.2 9.2 2.4 1.5 3.2 4.6 1.7 7zm9.5-21.1c-1.9 3-5.8 4-8.8 2.1-22-13.5-55.5-17.4-81.5-9.5-3.4 1-7-.9-8-4.3-1-3.4.9-7 4.3-8 29.8-9 66.7-4.7 92 10.9 3 1.9 4 5.8 2 8.8zm.8-22c-26.4-15.7-70-17.1-95.2-9.5-4 1.2-8.3-1-9.5-5-1.2-4 1-8.3 5-9.5 29-8.8 77.1-7.1 107.5 11 3.6 2.2 4.8 6.9 2.7 10.5-2.2 3.6-6.9 4.7-10.5 2.5z"
              fill="#000"
            />
          </svg>
        </div>

        <div className="relative z-20 max-w-[70%] pt-8">
          <h1
            className="font-black leading-[0.88] text-white text-[72px] sm:text-[104px] md:text-[140px] lg:text-[175px]"
            style={{ letterSpacing: "-0.04em", WebkitTextStroke: "1px white" }}
          >
            <span className="block whitespace-nowrap">The ultimate</span>
            <span className="block whitespace-nowrap">home for</span>
            <span className="block whitespace-nowrap">
              <span
                key={currentWord}
                className="italic font-serif inline-block"
                style={{
                  fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif",
                  animation: "fadeSlide 0.5s ease-out both",
                  WebkitTextStroke: "0",
                }}
              >
                {currentWord}
              </span>
            </span>
          </h1>

          <p className="mt-10 md:mt-16 max-w-md text-base md:text-lg text-white">
            You&apos;re now on Spotify Free and will hear ads. Rejoin Premium Individual for nonstop music and more.
          </p>

          <button
            onClick={() => toast("Demo only — no real checkout here")}
            className="mt-6 inline-flex items-center h-12 px-8 rounded-full bg-[#ffd2d7] text-black text-sm font-bold hover:scale-[1.04] transition-transform"
          >
            Renew subscription
          </button>

          <p className="mt-5 text-xs text-white/80">
            Premium Individual only.{" "}
            <Link href="#" onClick={(e) => { e.preventDefault(); toast("Terms not included in demo"); }} className="underline hover:text-white">
              Terms apply.
            </Link>
          </p>
        </div>
      </section>

      {/* Plans grid */}
      <section className="px-6 md:px-12 lg:px-20 py-12 border-t border-white/5">
        <h2 className="text-3xl md:text-4xl font-black mb-8">Affordable plans for any situation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PlanCard
            title="Individual"
            titleColor="#ff9aa8"
            price="$12.99 / month"
            bullets={[
              "1 Premium account",
              "15 hours/month of listening time from our audiobooks subscriber catalog",
              "Cancel anytime",
            ]}
            cta="Get Premium Individual"
            ctaColor="#ffc9d1"
            footer="Terms apply."
            onClick={() => toast("Demo only — no real checkout here")}
          />
          <PlanCard
            title="Student"
            titleColor="#c3a7e0"
            price="$6.99 / month"
            bullets={[
              "1 verified Premium account",
              "Discount for eligible students",
              "Access to Hulu",
              "Cancel anytime",
            ]}
            cta="Get Premium Student"
            ctaColor="#c3a7e0"
            footer="Spotify Premium Student offer currently includes access to Hulu plan on us, subject to eligibility. Offer available only to students at an eligible accredited higher education institution. Terms apply."
            onClick={() => toast("Demo only — no real checkout here")}
          />
          <PlanCard
            title="Duo"
            titleColor="#ffa24a"
            price="$18.99 / month"
            bullets={[
              "2 Premium accounts",
              "15 hours/month of listening time from our audiobooks subscriber catalog (plan manager only)",
              "Cancel anytime",
            ]}
            cta="Get Premium Duo"
            ctaColor="#f5b878"
            footer="For couples who reside at the same address. Terms apply."
            onClick={() => toast("Demo only — no real checkout here")}
          />
          <PlanCard
            title="Family"
            titleColor="#b7c1d4"
            price="$21.99 / month"
            bullets={[
              "Up to 6 Premium accounts",
              "Parental controls for the plan manager",
              "15 hours/month of listening time from our audiobooks subscriber catalog (plan manager only)",
              "Ability to create accounts for listeners under 13",
              "Cancel anytime",
            ]}
            cta="Get Premium Family"
            ctaColor="#b7c1d4"
            footer="For up to 6 family members residing at the same address. Terms apply."
            onClick={() => toast("Demo only — no real checkout here")}
          />
        </div>
      </section>

      <style jsx global>{`
        @keyframes fadeSlide {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function PlanCard({
  title,
  titleColor,
  price,
  bullets,
  cta,
  ctaColor,
  footer,
  onClick,
}: {
  title: string;
  titleColor: string;
  price: string;
  bullets: string[];
  cta: string;
  ctaColor: string;
  footer: string;
  onClick: () => void;
}) {
  const footerParts = footer.split(/(Terms apply\.)/);

  return (
    <div className="rounded-xl p-8 flex flex-col bg-[#141414]">
      <div className="flex items-center gap-2 mb-5">
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#fff">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
        </svg>
        <span className="text-base font-bold text-white">Premium</span>
      </div>

      <h3 className="text-4xl md:text-5xl font-black" style={{ color: titleColor }}>{title}</h3>
      <p className="text-base font-bold text-white mt-3">{price}</p>

      <div className="border-t border-white/10 my-5" />

      <ul className="space-y-3 flex-1">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-3 text-sm text-white">
            <span className="mt-[7px] w-1 h-1 rounded-full bg-white flex-shrink-0" />
            <span className="leading-relaxed">{b}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={onClick}
        className="mt-6 h-12 rounded-full text-base font-bold text-black hover:scale-[1.03] transition-transform"
        style={{ backgroundColor: ctaColor }}
      >
        {cta}
      </button>

      <p className="text-xs text-[#b3b3b3] text-center mt-4 leading-relaxed">
        {footerParts.map((part, i) =>
          part === "Terms apply." ? (
            <a
              key={i}
              href="#"
              onClick={(e) => e.preventDefault()}
              className="underline hover:text-white"
            >
              {part}
            </a>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </p>
    </div>
  );
}
