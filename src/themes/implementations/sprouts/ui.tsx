/* eslint-disable @next/next/no-img-element -- site images may come from any host */
import {
  Apple,
  BookOpen,
  Brush,
  Bus,
  Heart,
  Music,
  Palette,
  Puzzle,
  ShieldCheck,
  Smile,
  Sprout,
  Star,
  Sun,
  Trees,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export const MUTED = "text-[var(--site-muted)]";

// Decorative colors. Each card or bubble picks one, and the text on it stays dark.
export const COLORS = {
  sun: { solid: "var(--sp-sun)", soft: "color-mix(in srgb, var(--sp-sun) 22%, white)" },
  coral: { solid: "var(--sp-coral)", soft: "color-mix(in srgb, var(--sp-coral) 18%, white)" },
  mint: { solid: "var(--sp-mint)", soft: "color-mix(in srgb, var(--sp-mint) 18%, white)" },
  grape: { solid: "var(--sp-grape)", soft: "color-mix(in srgb, var(--sp-grape) 16%, white)" },
  sky: { solid: "var(--sp-sky)", soft: "color-mix(in srgb, var(--sp-sky) 18%, white)" },
} as const;

export type ColorId = keyof typeof COLORS;
export const COLOR_IDS = Object.keys(COLORS) as [ColorId, ...ColorId[]];
export const COLOR_OPTIONS = [
  { value: "sun", label: "Sunshine yellow" },
  { value: "coral", label: "Coral" },
  { value: "mint", label: "Mint green" },
  { value: "grape", label: "Grape purple" },
  { value: "sky", label: "Sky blue" },
];
export const colorAt = (index: number) => COLOR_IDS[index % COLOR_IDS.length]!;

const ICONS: Record<string, LucideIcon> = {
  sprout: Sprout,
  book: BookOpen,
  palette: Palette,
  music: Music,
  puzzle: Puzzle,
  apple: Apple,
  sun: Sun,
  heart: Heart,
  shield: ShieldCheck,
  bus: Bus,
  trees: Trees,
  brush: Brush,
  smile: Smile,
  star: Star,
};

export const ICON_IDS = Object.keys(ICONS) as [string, ...string[]];
export const ICON_OPTIONS = ICON_IDS.map((value) => ({ value, label: value[0]!.toUpperCase() + value.slice(1) }));

export function Icon({ name, size = 24, className }: { name: string; size?: number; className?: string }) {
  const Component = ICONS[name] ?? Sprout;
  return <Component size={size} strokeWidth={2} className={className} aria-hidden />;
}

export function Doodle({ kind, className = "" }: { kind: "star" | "sun" | "squiggle" | "dots"; className?: string }) {
  switch (kind) {
    case "star":
      return (
        <svg viewBox="0 0 40 40" className={className} aria-hidden>
          <path d="m20 3 5 11 12 1.5-9 8.5 2.5 12L20 30l-10.5 6L12 24l-9-8.5L15 14Z" fill="var(--sp-sun)" stroke="#2b2b2b" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      );
    case "sun":
      return (
        <svg viewBox="0 0 60 60" className={className} aria-hidden>
          <g stroke="var(--sp-coral)" strokeWidth="3.5" strokeLinecap="round">
            {Array.from({ length: 8 }, (_, index) => (
              <line key={index} x1="30" y1="4" x2="30" y2="12" transform={`rotate(${index * 45} 30 30)`} />
            ))}
          </g>
          <circle cx="30" cy="30" r="12" fill="var(--sp-sun)" />
        </svg>
      );
    case "squiggle":
      return (
        <svg viewBox="0 0 120 24" className={className} aria-hidden>
          <path d="M3 12c10-12 20 12 30 0s20 12 30 0 20 12 30 0 14 8 24 0" fill="none" stroke="var(--sp-mint)" strokeWidth="5" strokeLinecap="round" />
        </svg>
      );
    case "dots":
      return (
        <svg viewBox="0 0 60 60" className={className} aria-hidden>
          {Array.from({ length: 16 }, (_, index) => (
            <circle key={index} cx={8 + (index % 4) * 15} cy={8 + Math.floor(index / 4) * 15} r="3" fill="var(--sp-grape)" opacity="0.55" />
          ))}
        </svg>
      );
  }
}

// A soft wave that joins two sections of different colors.
export function Wave({ fill, flip }: { fill: string; flip?: boolean }) {
  return (
    <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className={`block h-10 w-full sm:h-16 ${flip ? "rotate-180" : ""}`} aria-hidden>
      <path d="M0 40c160 30 320 40 480 20S800 0 960 14s320 46 480 26v40H0Z" fill={fill} />
    </svg>
  );
}

export function SectionHeading({ eyebrow, title, text, center = true }: { eyebrow?: string; title: string; text?: string; center?: boolean }) {
  return (
    <div className={`sp-reveal max-w-2xl ${center ? "mx-auto text-center" : ""}`}>
      {eyebrow && (
        <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--sp-cream)] px-4 py-1.5 text-sm font-bold text-[var(--site-primary)]">
          <Sprout size={16} aria-hidden />
          {eyebrow}
        </p>
      )}
      <h2 className="text-[clamp(2rem,4.2vw,3.3rem)] leading-[1.1] font-bold tracking-tight">{title}</h2>
      {text && <p className={`mt-4 text-lg leading-8 ${MUTED}`}>{text}</p>}
    </div>
  );
}

export function Photo({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return <img src={src} alt={alt} loading="lazy" className={`absolute inset-0 size-full object-cover ${className}`} />;
}

export function Bubble({ href, children, variant = "solid" }: { href: string; children: ReactNode; variant?: "solid" | "sun" | "outline" }) {
  const styles = {
    solid: "bg-[var(--site-primary)] text-[var(--site-on-primary)] shadow-[0_6px_0_color-mix(in_srgb,var(--site-primary)_60%,black)]",
    sun: "bg-[var(--sp-sun)] text-[#2b2108] shadow-[0_6px_0_#d9a21a]",
    outline: "border-2 border-[var(--site-text)] bg-white text-[var(--site-text)] shadow-[0_6px_0_var(--site-text)]",
  }[variant];
  return (
    <Link href={href} className={`inline-flex min-h-12 items-center gap-2 rounded-full px-7 text-base font-bold transition hover:-translate-y-0.5 active:translate-y-1 active:shadow-none ${styles}`}>
      {children}
    </Link>
  );
}
