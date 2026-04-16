"use client";

import { Song } from "@/lib/supabase";
import { useToast } from "@/hooks/useToast";

interface CreditsModalProps {
  song: Song;
  onClose: () => void;
}

const FAKE_WRITERS = [
  "Julian Nixon", "Dominic Angelella", "Sarah Aarons",
  "Dacoury Dahi Natche", "Anderson .Paak",
];
const FAKE_PRODUCERS = [
  "Dahi", "Ritz Reynolds", "Craig Balmoris", "Spencer Stewart", "Brandon Hernandez",
];
const FAKE_PERFORMERS = [
  { name: "Jaelen Irizarry", role: "Background Vocals" },
  { name: "Christian Farlow", role: "Background Vocals" },
  { name: "Dominic Angelella", role: "Guitar" },
];
const SOURCES = ["Atlantic Records"];

function pickRandom<T>(arr: T[], count: number, seed: string): T[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    h = ((h << 5) - h + i) | 0;
    const j = Math.abs(h) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

export function CreditsModal({ song, onClose }: CreditsModalProps) {
  const { toast } = useToast();
  const artist = song.artist || "Unknown Artist";
  const seed = song.id || song.title;

  const writers = [artist, ...pickRandom(FAKE_WRITERS, 3, seed + "w")];
  const producers = pickRandom(FAKE_PRODUCERS, 3, seed + "p");
  const performers = [
    { name: artist, role: "Vocals" },
    ...pickRandom(FAKE_PERFORMERS, 2, seed + "perf"),
  ];

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-[#121212] w-full max-w-[480px] max-h-[85vh] rounded-lg flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Credits</h2>
              <p className="text-sm text-[#b3b3b3] mt-1">{song.title}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-[#b3b3b3] hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z" /></svg>
            </button>
          </div>
          <div className="mt-4 h-[2px] bg-gradient-to-r from-[#450af5] via-[#8e8ee5] to-[#c4efd9]" />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {/* Artist */}
          <section className="mb-6">
            <h3 className="text-base font-bold text-white mb-4">Artist</h3>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-white">{artist}</p>
                <p className="text-xs text-[#b3b3b3]">Main Artist</p>
              </div>
              <button
                onClick={() => toast("Follow is not available yet")}
                className="px-4 py-1.5 text-xs font-bold text-white border border-[#727272] rounded-full hover:border-white hover:scale-105 transition-all"
              >
                Follow
              </button>
            </div>
          </section>

          {/* Composition & Lyrics */}
          <section className="mb-6">
            <h3 className="text-base font-bold text-white mb-4">Composition &amp; Lyrics</h3>
            {writers.map((name, i) => (
              <div key={`writer-${i}`} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm text-white">{name}</p>
                  <p className="text-xs text-[#b3b3b3]">
                    {i === 0 ? "Writer" : i === writers.length - 1 ? "Writer \u00B7 Additional Arranger" : "Writer"}
                  </p>
                </div>
                {i >= 2 && (
                  <svg className="w-4 h-4 text-[#b3b3b3] flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M1 2.75A.75.75 0 011.75 2H7v1.5H2.5v10h10V9H14v5.25a.75.75 0 01-.75.75H1.75a.75.75 0 01-.75-.75V2.75z" /><path d="M15 1.5H10V0h5.25a.75.75 0 01.75.75V6h-1.5V2.56l-5.22 5.22-1.06-1.06L13.44 1.5z" /></svg>
                )}
              </div>
            ))}
          </section>

          {/* Production & Engineering */}
          <section className="mb-6">
            <h3 className="text-base font-bold text-white mb-4">Production &amp; Engineering</h3>
            {producers.map((name, i) => (
              <div key={`prod-${i}`} className="py-2">
                <p className="text-sm text-white">{name}</p>
                <p className="text-xs text-[#b3b3b3]">Producer</p>
              </div>
            ))}
          </section>

          {/* Performers */}
          <section className="mb-6">
            <h3 className="text-base font-bold text-white mb-4">Performers</h3>
            {performers.map((p, i) => (
              <div key={`perf-${i}`} className="py-2">
                <p className="text-sm text-white">{p.name}</p>
                <p className="text-xs text-[#b3b3b3]">{p.role}</p>
              </div>
            ))}
          </section>

          {/* Sources */}
          <section className="mb-6">
            <h3 className="text-base font-bold text-white mb-4">Sources</h3>
            {SOURCES.map((s, i) => (
              <p key={`src-${i}`} className="text-sm text-[#b3b3b3]">{s}</p>
            ))}
          </section>

          {/* Report error */}
          <button
            onClick={() => toast("Report is not available")}
            className="flex items-center gap-2 text-sm font-bold text-[#b3b3b3] hover:text-white transition-colors"
          >
            Report error
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M1 2.75A.75.75 0 011.75 2H7v1.5H2.5v10h10V9H14v5.25a.75.75 0 01-.75.75H1.75a.75.75 0 01-.75-.75V2.75z" /><path d="M15 1.5H10V0h5.25a.75.75 0 01.75.75V6h-1.5V2.56l-5.22 5.22-1.06-1.06L13.44 1.5z" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
