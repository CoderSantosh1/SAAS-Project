/* eslint-disable @next/next/no-img-element -- site images may come from any host */
import {
  Eye,
  HandHeart,
  Heart,
  HeartHandshake,
  Lightbulb,
  Microscope,
  ShieldCheck,
  Sparkles,
  Target,
  UserRoundCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

export const BRAND = "text-[var(--bl-brand)]";
export const DEEP = "text-[var(--site-primary)]";
export const MUTED = "text-[var(--site-muted)]";
export const LINE = "border-[var(--site-border)]";

export const ICONS: Record<string, LucideIcon> = {
  "heart-handshake": HeartHandshake,
  microscope: Microscope,
  "user-check": UserRoundCheck,
  "hand-heart": HandHeart,
  "shield-check": ShieldCheck,
  lightbulb: Lightbulb,
  users: Users,
  target: Target,
  eye: Eye,
  heart: Heart,
  sparkles: Sparkles,
};

export const ICON_IDS = Object.keys(ICONS) as [string, ...string[]];

export const ICON_OPTIONS = [
  { value: "heart-handshake", label: "Caring hands" },
  { value: "microscope", label: "Microscope" },
  { value: "user-check", label: "Specialist" },
  { value: "hand-heart", label: "Compassion" },
  { value: "shield-check", label: "Trust" },
  { value: "lightbulb", label: "Idea" },
  { value: "users", label: "People" },
  { value: "target", label: "Goal" },
  { value: "eye", label: "Vision" },
  { value: "heart", label: "Heart" },
  { value: "sparkles", label: "Sparkles" },
];

export function Icon({ name, size = 22, className }: { name: string; size?: number; className?: string }) {
  const Component = ICONS[name] ?? Heart;
  return <Component size={size} strokeWidth={1.7} className={className} aria-hidden />;
}

// Small line-flanked label, then a serif title with an italic second line.
export function SectionHeading({
  eyebrow,
  title,
  accent,
  left,
  light,
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: string;
  accent?: string;
  left?: boolean;
  light?: boolean;
  as?: "h1" | "h2";
}) {
  const rule = `h-px w-8 ${light ? "bg-white/60" : "bg-[var(--bl-brand)]"}`;
  return (
    <div className={`bl-reveal ${left ? "text-left" : "mx-auto text-center"}`}>
      {eyebrow && (
        <p className={`mb-4 inline-flex items-center gap-3 text-[11px] font-semibold tracking-[0.3em] uppercase ${light ? "text-white/85" : DEEP}`}>
          <span className={rule} />
          {eyebrow}
          {!left && <span className={rule} />}
        </p>
      )}
      <Tag className={`text-[clamp(2.2rem,4.6vw,4.2rem)] leading-[1.05] font-medium tracking-[-0.02em] ${light ? "text-white" : ""}`}>
        <span className="block">{title}</span>
        {accent && <span className={`block italic ${light ? "text-[var(--bl-blush)]" : BRAND}`}>{accent}</span>}
      </Tag>
    </div>
  );
}

export function Photo({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return <img src={src} alt={alt} loading="lazy" className={`absolute inset-0 size-full object-cover ${className}`} />;
}

export function PillLink({ href, children, light }: { href: string; children: ReactNode; light?: boolean }) {
  return (
    <Link
      href={href}
      className={`group inline-flex min-h-11 items-center gap-3 rounded-full py-1.5 pr-1.5 pl-6 text-sm font-semibold shadow-lg transition hover:-translate-y-0.5 ${
        light
          ? "bg-white text-[var(--site-primary)] shadow-black/10"
          : "bg-[var(--site-primary)] text-[var(--site-on-primary)] shadow-[color-mix(in_srgb,var(--site-primary)_25%,transparent)]"
      }`}
    >
      {children}
      <span className={`flex size-9 items-center justify-center rounded-full transition-transform duration-300 group-hover:-rotate-45 ${light ? "bg-[var(--site-primary)] text-white" : "bg-white/20"}`}>
        <ArrowRight size={17} aria-hidden />
      </span>
    </Link>
  );
}
