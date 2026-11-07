/* eslint-disable @next/next/no-img-element -- site images may come from any host */
import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  FlaskConical,
  GraduationCap,
  Landmark,
  Music,
  Palette,
  ShieldCheck,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { iconLabel, INDUSTRY_ICONS } from "../../shared/icons";

export const MUTED = "text-[var(--site-muted)]";
export const LINE = "border-[var(--site-border)]";

const ICONS: Record<string, LucideIcon> = {
  "graduation-cap": GraduationCap,
  book: BookOpen,
  flask: FlaskConical,
  calendar: CalendarDays,
  trophy: Trophy,
  palette: Palette,
  music: Music,
  users: Users,
  award: Award,
  shield: ShieldCheck,
  landmark: Landmark,
  ...INDUSTRY_ICONS,
};

export const ICON_IDS = Object.keys(ICONS) as [string, ...string[]];

const SCHOOL_ICON_OPTIONS = [
  { value: "graduation-cap", label: "Graduation cap" },
  { value: "book", label: "Book" },
  { value: "flask", label: "Science" },
  { value: "calendar", label: "Calendar" },
  { value: "trophy", label: "Trophy" },
  { value: "palette", label: "Art" },
  { value: "music", label: "Music" },
  { value: "users", label: "People" },
  { value: "award", label: "Award" },
  { value: "shield", label: "Safety" },
  { value: "landmark", label: "Campus" },
];

export const ICON_OPTIONS = [
  ...SCHOOL_ICON_OPTIONS,
  ...Object.keys(INDUSTRY_ICONS)
    .filter((value) => !SCHOOL_ICON_OPTIONS.some((option) => option.value === value))
    .map((value) => ({ value, label: iconLabel(value) })),
];

export function Icon({ name, size = 22, className }: { name: string; size?: number; className?: string }) {
  const Component = ICONS[name] ?? GraduationCap;
  return <Component size={size} strokeWidth={1.6} className={className} aria-hidden />;
}

export function Crest({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 44" className={className} aria-hidden>
      <path d="M20 2 37 8v13c0 10-7 17-17 21C10 38 3 31 3 21V8Z" fill="var(--site-primary)" />
      <path d="M20 6 33 10.5V21c0 7.8-5.3 13.4-13 16.8C12.3 34.4 7 28.8 7 21V10.5Z" fill="none" stroke="var(--cv-gold)" strokeWidth="1.5" />
      <path d="M12 17h16v2H12Zm2 4h12v8l-6 3-6-3Z" fill="var(--cv-gold)" />
    </svg>
  );
}

// The logo mark: the shield crest, or an industry icon on an accent-ringed tile.
export function Mark({ icon, className = "" }: { icon?: string; className?: string }) {
  if (!icon) return <Crest className={className} />;
  return (
    <span
      className={`inline-flex items-center justify-center rounded-[var(--site-radius)] bg-[var(--site-primary)] text-[var(--cv-gold)] shadow-[inset_0_0_0_1.5px_var(--cv-gold)] ${className}`}
      aria-hidden
    >
      <Icon name={icon} size={20} />
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  text,
  center,
  light,
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  center?: boolean;
  light?: boolean;
}) {
  return (
    <div className={`cv-reveal max-w-2xl ${center ? "mx-auto text-center" : ""}`}>
      {eyebrow && (
        <p className={`cv-label ${center ? "cv-label-center" : ""} mb-4 text-xs font-semibold tracking-[0.22em] uppercase ${light ? "text-[var(--cv-gold)]" : "text-[var(--site-primary)]"}`}>
          {eyebrow}
        </p>
      )}
      <h2 className={`text-[clamp(2rem,4vw,3.25rem)] leading-[1.1] font-semibold ${light ? "text-white" : ""}`}>{title}</h2>
      {text && <p className={`mt-4 text-lg leading-8 ${light ? "text-white/80" : MUTED}`}>{text}</p>}
    </div>
  );
}

export function Photo({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return <img src={src} alt={alt} loading="lazy" className={`absolute inset-0 size-full object-cover ${className}`} />;
}

export function ActionLink({ href, children, variant = "solid" }: { href: string; children: ReactNode; variant?: "solid" | "light" | "outline" }) {
  const styles = {
    solid: "bg-[var(--site-primary)] text-[var(--site-on-primary)] hover:bg-[var(--cv-deep)]",
    light: "bg-[var(--cv-gold)] text-[#1b1606] hover:brightness-105",
    outline: "border border-white/60 text-white hover:bg-white/10",
  }[variant];
  return (
    <Link href={href} className={`group inline-flex min-h-12 items-center gap-2 rounded-[var(--site-radius)] px-6 text-sm font-semibold transition ${styles}`}>
      {children}
      <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden />
    </Link>
  );
}
