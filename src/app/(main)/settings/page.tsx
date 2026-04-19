"use client";

import { ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";

export default function SettingsPage() {
  const { toast } = useToast();
  const router = useRouter();

  const [language, setLanguage] = useState("English (English)");
  const [streamingQuality, setStreamingQuality] = useState("Automatic");
  const [normalizeVolume, setNormalizeVolume] = useState(false);
  const [compactLibrary, setCompactLibrary] = useState(false);
  const [showNowPlaying, setShowNowPlaying] = useState(true);
  const [canvas, setCanvas] = useState(true);
  const [publicPlaylists, setPublicPlaylists] = useState(true);
  const [showFollow, setShowFollow] = useState(true);
  const [shareActivity, setShareActivity] = useState(false);

  return (
    <div className="px-8 py-8 max-w-5xl mx-auto text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-black">Settings</h1>
        <button
          onClick={() => toast("Search in settings not available yet")}
          className="w-9 h-9 rounded-full flex items-center justify-center text-[#b3b3b3] hover:text-white transition-colors"
          title="Search in settings"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>

      {/* Account */}
      <Section title="Account">
        <SettingRow
          label="Edit login methods"
          control={
            <PillButton onClick={() => toast("Login methods editor not available")}>
              <span>Edit</span>
              <ExternalIcon />
            </PillButton>
          }
        />
      </Section>

      {/* Language */}
      <Section title="Language">
        <SettingRow
          label="Choose language - Changes will be applied after restarting the app"
          control={
            <SelectBox
              value={language}
              onChange={setLanguage}
              options={["English (English)", "Español (Spanish)", "Français (French)", "Português (Portuguese)", "Deutsch (German)"]}
            />
          }
        />
      </Section>

      {/* Audio quality */}
      <Section title="Audio quality">
        <SettingRow
          label="Streaming quality"
          control={
            <SelectBox
              value={streamingQuality}
              onChange={setStreamingQuality}
              options={["Automatic", "Low", "Normal", "High", "Very High"]}
            />
          }
        />
        <SettingRow
          label="Normalize volume - Set the same volume level for all songs and podcasts"
          control={<Toggle checked={normalizeVolume} onChange={setNormalizeVolume} />}
        />
      </Section>

      {/* Your Library */}
      <Section title="Your Library">
        <SettingRow
          label="Use compact library layout"
          control={<Toggle checked={compactLibrary} onChange={setCompactLibrary} />}
        />
        <SettingRow
          label="Import music from other apps"
          control={
            <PillButton onClick={() => toast("Import library is not available in this demo")}>
              <span>Import library</span>
            </PillButton>
          }
        />
      </Section>

      {/* Display */}
      <Section title="Display">
        <SettingRow
          label="Show the now-playing panel on click of play"
          control={<Toggle checked={showNowPlaying} onChange={setShowNowPlaying} />}
        />
        <SettingRow
          label="Display short, looping visuals on tracks (Canvas)"
          control={<Toggle checked={canvas} onChange={setCanvas} />}
        />
      </Section>

      {/* Playback */}
      <Section title="Playback">
        <div className="bg-[#141414] rounded-xl p-6 mt-3">
          <Equalizer />
          <div className="mt-5 bg-[#1e1e1e] rounded-lg p-5 flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white">Fine-tune your sound with the Mac app</h3>
              <p className="text-sm text-[#b3b3b3] mt-1">
                Improve streaming quality, adjust the equalizer to best fit your speakers, and enjoy consistent volume across all your tracks.
              </p>
            </div>
            <button
              onClick={() => toast("Desktop app download not available in this demo")}
              className="flex-shrink-0 bg-[#1ed760] text-black font-bold text-sm px-6 h-11 rounded-full hover:scale-[1.04] transition-transform"
            >
              Download the free app
            </button>
          </div>
        </div>
      </Section>

      {/* Social */}
      <Section title="Social">
        <SettingRow
          label="People can see the playlists you've added to your profile."
          control={<Toggle checked={publicPlaylists} onChange={setPublicPlaylists} />}
        />
        <SettingRow
          label="On your profile, people can see who's following you and who you're following."
          control={<Toggle checked={showFollow} onChange={setShowFollow} />}
        />
        <SettingRow
          label="Share my listening activity with followers on desktop"
          control={<Toggle checked={shareActivity} onChange={setShareActivity} />}
        />
      </Section>

      <div className="border-t border-white/10 mt-10 pt-10">
        <Footer onNavigate={(to) => router.push(to)} onToast={toast} />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-base font-bold text-white mb-2">{title}</h2>
      <div className="flex flex-col">{children}</div>
    </section>
  );
}

function SettingRow({ label, control }: { label: string; control: ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 gap-6">
      <p className="text-sm text-[#e4e4e4] min-w-0 flex-1">{label}</p>
      <div className="flex-shrink-0">{control}</div>
    </div>
  );
}

function PillButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-5 h-9 rounded-full border border-white text-sm font-bold text-white hover:scale-[1.04] transition-transform"
    >
      {children}
    </button>
  );
}

function ExternalIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14L21 3m0 0h-7m7 0v7M21 14v5a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h5" />
    </svg>
  );
}

function SelectBox({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-[#2a2a2a] text-white text-sm rounded-md pl-4 pr-10 h-9 min-w-[180px] cursor-pointer hover:bg-[#333] transition-colors focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white"
        fill="currentColor"
        viewBox="0 0 16 16"
      >
        <path d="M14 6l-6 6-6-6 1.41-1.41L8 9.17l4.59-4.58L14 6z" />
      </svg>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? "bg-[#1ed760]" : "bg-[#535353]"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function Equalizer() {
  const bands = ["60Hz", "150Hz", "400Hz", "1KHz", "2.4KHz", "15KHz"];
  const width = 680;
  const height = 260;
  const padX = 60;
  const padY = 30;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const midY = padY + innerH / 2;
  const xs = bands.map((_, i) => padX + (innerW * i) / (bands.length - 1));

  return (
    <div className="relative w-full overflow-hidden">
      <p className="text-xs font-bold text-white mb-2">Playback</p>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Top/bottom labels */}
        <text x="10" y={padY + 10} fill="#e4e4e4" fontSize="12" fontWeight="600">+12dB</text>
        <text x="10" y={padY + innerH} fill="#e4e4e4" fontSize="12" fontWeight="600">-12dB</text>

        {/* Vertical band guides */}
        {xs.map((x, i) => (
          <line
            key={i}
            x1={x}
            x2={x}
            y1={padY}
            y2={padY + innerH}
            stroke="#3a3a3a"
            strokeWidth="1"
          />
        ))}

        {/* Horizontal midline */}
        <line
          x1={padX}
          x2={padX + innerW}
          y1={midY}
          y2={midY}
          stroke="#7a7a7a"
          strokeWidth="1"
        />

        {/* Filled area below the curve */}
        <path
          d={`M ${xs[0]} ${midY} ${xs.map((x) => `L ${x} ${midY}`).join(" ")} L ${xs[xs.length - 1]} ${padY + innerH} L ${xs[0]} ${padY + innerH} Z`}
          fill="url(#eqGrad)"
          opacity="0.6"
        />

        <defs>
          <linearGradient id="eqGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#d1d1d1" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#d1d1d1" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Curve */}
        <polyline
          points={xs.map((x) => `${x},${midY}`).join(" ")}
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
        />

        {/* Draggable nodes */}
        {xs.map((x, i) => (
          <circle key={i} cx={x} cy={midY} r="6" fill="#ffffff" stroke="#000" strokeWidth="1" />
        ))}

        {/* Band labels */}
        {bands.map((b, i) => (
          <text
            key={b}
            x={xs[i]}
            y={padY + innerH + 22}
            textAnchor="middle"
            fill="#e4e4e4"
            fontSize="12"
            fontWeight="600"
          >
            {b}
          </text>
        ))}
      </svg>
    </div>
  );
}

function Footer({ onNavigate, onToast }: { onNavigate: (to: string) => void; onToast: (msg: string) => void }) {
  const stub = (label: string) => () => onToast(`${label} is not available in this demo`);

  return (
    <div className="flex flex-wrap items-start gap-10 pb-6">
      <FooterCol title="Company">
        <FooterLink onClick={stub("About")}>About</FooterLink>
        <FooterLink onClick={stub("Jobs")}>Jobs</FooterLink>
        <FooterLink onClick={stub("For the Record")}>For the Record</FooterLink>
      </FooterCol>
      <FooterCol title="Communities">
        <FooterLink onClick={stub("For Artists")}>For Artists</FooterLink>
        <FooterLink onClick={stub("Developers")}>Developers</FooterLink>
        <FooterLink onClick={stub("Advertising")}>Advertising</FooterLink>
        <FooterLink onClick={stub("Investors")}>Investors</FooterLink>
        <FooterLink onClick={stub("Vendors")}>Vendors</FooterLink>
      </FooterCol>
      <FooterCol title="Useful links">
        <FooterLink onClick={stub("Support")}>Support</FooterLink>
        <FooterLink onClick={stub("Free Mobile App")}>Free Mobile App</FooterLink>
        <FooterLink onClick={stub("Popular by Country")}>Popular by Country</FooterLink>
        <FooterLink onClick={stub("Import your music")}>Import your music</FooterLink>
      </FooterCol>
      <FooterCol title="Spotify Plans">
        <FooterLink onClick={() => onNavigate("/premium")}>Premium Individual</FooterLink>
        <FooterLink onClick={() => onNavigate("/premium")}>Premium Duo</FooterLink>
        <FooterLink onClick={() => onNavigate("/premium")}>Premium Family</FooterLink>
        <FooterLink onClick={() => onNavigate("/premium")}>Premium Student</FooterLink>
        <FooterLink onClick={() => onNavigate("/premium")}>Spotify Free</FooterLink>
        <FooterLink onClick={stub("Audiobooks Access")}>Audiobooks Access</FooterLink>
      </FooterCol>
      <div className="flex items-center gap-3 ml-auto">
        <SocialIcon label="Instagram" onClick={stub("Instagram")}>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.22.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.05.41 2.22.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.22-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.05.36-2.22.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.22-.41a3.71 3.71 0 01-1.38-.9 3.71 3.71 0 01-.9-1.38c-.16-.42-.36-1.05-.41-2.22C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.22.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.05-.36 2.22-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.31-1.46.72-2.13 1.38A5.87 5.87 0 00.63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.79.72 1.46 1.38 2.13a5.87 5.87 0 002.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.79-.31 1.46-.72 2.13-1.38a5.87 5.87 0 001.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.87 5.87 0 00-1.38-2.13A5.87 5.87 0 0019.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32zm0 10.16a4 4 0 110-8 4 4 0 010 8zm6.41-10.4a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z" />
          </svg>
        </SocialIcon>
        <SocialIcon label="Twitter" onClick={stub("Twitter")}>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </SocialIcon>
        <SocialIcon label="Facebook" onClick={stub("Facebook")}>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.47H7.078V12h3.047V9.356c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.234 2.686.234v2.953H15.83c-1.491 0-1.956.925-1.956 1.875V12h3.328l-.532 3.47h-2.796v8.385C19.612 22.954 24 17.99 24 12z" />
          </svg>
        </SocialIcon>
      </div>
    </div>
  );
}

function FooterCol({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 min-w-[140px]">
      <h4 className="text-sm font-bold text-white mb-1">{title}</h4>
      {children}
    </div>
  );
}

function FooterLink({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-sm text-[#b3b3b3] hover:text-white hover:underline text-left transition-colors"
    >
      {children}
    </button>
  );
}

function SocialIcon({ label, children, onClick }: { label: string; children: ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="w-10 h-10 rounded-full bg-[#292929] flex items-center justify-center text-white hover:bg-[#1ed760] hover:text-black transition-colors"
    >
      {children}
    </button>
  );
}
