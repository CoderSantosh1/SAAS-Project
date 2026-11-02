/* eslint-disable @next/next/no-img-element -- site images may come from any host */
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "./icons";

export const GOLD = "text-[var(--lx-gold)]";
export const GOLD_DEEP = "text-[var(--site-primary)]";
export const MUTED = "text-[var(--site-muted)]";
export const LINE = "border-[var(--site-border)]";

export function Eyebrow({ children, center }: { children: ReactNode; center?: boolean }) {
  return (
    <p className={`flex items-center gap-3 text-[11px] font-medium tracking-[0.3em] uppercase ${GOLD_DEEP} ${center ? "justify-center" : ""}`}>
      <span className="h-px w-8 bg-[var(--lx-gold)]" />
      {children}
    </p>
  );
}

// Small gold label and a large serif title, with an optional italic gold accent.
export function SectionHeading({
  eyebrow,
  title,
  accent,
  center,
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: string;
  accent?: string;
  center?: boolean;
  as?: "h1" | "h2";
}) {
  return (
    <div className={`lx-reveal ${center ? "text-center" : ""}`}>
      {eyebrow && <Eyebrow center={center}>{eyebrow}</Eyebrow>}
      <Tag className="mt-4 text-[clamp(40px,6vw,80px)] leading-[1] font-semibold">
        {title} {accent && <em className={`font-medium ${GOLD}`}>{accent}</em>}
      </Tag>
    </div>
  );
}

export function Photo({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return <img src={src} alt={alt} loading="lazy" className={`absolute inset-0 size-full object-cover ${className}`} />;
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2 text-sm font-medium hover:text-[var(--site-primary)]">
      {children}
      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

export function PillButton({ href, children, light }: { href: string; children: ReactNode; light?: boolean }) {
  return (
    <Link
      href={href}
      className={`group inline-flex min-h-11 items-center gap-3 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 ${
        light
          ? "bg-[var(--site-background)] text-[var(--site-text)] hover:bg-[var(--lx-gold-soft)]"
          : "bg-[var(--site-text)] text-[var(--site-background)] hover:bg-[var(--site-primary)] hover:text-[var(--site-on-primary)]"
      }`}
    >
      {children}
      <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
    </Link>
  );
}
