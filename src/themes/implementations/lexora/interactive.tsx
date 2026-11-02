"use client";

/* eslint-disable @next/next/no-img-element -- site images may come from any host */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Pillar, Quote, Star } from "./icons";

// Every component here renders its full content on the server. Scripts only add motion,
// so the theme still reads correctly in previews that run no scripts.

export function LexoraHeader({
  siteName,
  logoUrl,
  homeHref,
  links,
}: {
  siteName: string;
  logoUrl?: string;
  homeHref: string;
  links: { label: string; href: string }[];
}) {
  const [open, setOpen] = useState(false);
  const contact = links.find((link) => /\/contact$/.test(link.href));

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--site-border)] bg-[color-mix(in_srgb,var(--site-background)_92%,transparent)] backdrop-blur-md">
      <div className="lx-shell flex h-[76px] items-center justify-between gap-6">
        <Link href={homeHref} className="inline-flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt={siteName} className="h-11 w-auto max-w-44 object-contain" />
          ) : (
            <>
              <Pillar className="size-9 text-[var(--lx-gold)]" />
              <span className="font-[family-name:var(--site-font-heading)] text-[27px] leading-none font-semibold">{siteName}</span>
            </>
          )}
        </Link>

        <nav aria-label="Site" className="hidden items-center gap-7 xl:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="group relative py-7 text-[14px] text-[color-mix(in_srgb,var(--site-text)_80%,transparent)] transition-colors hover:text-[var(--site-primary)]">
              {link.label}
              <span className="absolute inset-x-0 bottom-5 h-px origin-right scale-x-0 bg-[var(--lx-gold)] transition-transform duration-500 group-hover:origin-left group-hover:scale-x-100" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {contact && (
            <Link
              href={contact.href}
              className="group hidden items-center gap-2.5 rounded-full bg-[var(--site-text)] px-5 py-3 text-[13px] font-medium text-[var(--site-background)] transition-all duration-500 hover:-translate-y-0.5 hover:bg-[var(--site-primary)] sm:inline-flex"
            >
              Book Consultation
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          )}
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="relative flex size-11 flex-col items-center justify-center gap-1 rounded-full border border-[color-mix(in_srgb,var(--site-text)_20%,transparent)] xl:hidden"
          >
            {[0, 1, 2].map((index) => (
              <span
                key={index}
                className={`block h-[1.5px] w-[17px] bg-[var(--site-text)] transition-all duration-500 ${
                  open && index === 0 ? "translate-y-[5.5px] rotate-45" : ""
                } ${open && index === 1 ? "opacity-0" : ""} ${open && index === 2 ? "-translate-y-[5.5px] -rotate-45" : ""}`}
              />
            ))}
          </button>
        </div>
      </div>

      {open && (
        <nav aria-label="Mobile" className="lx-shell flex flex-col gap-1 border-t border-[var(--site-border)] bg-[var(--site-background)] py-6 xl:hidden">
          {links.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="flex items-baseline gap-4 font-[family-name:var(--site-font-heading)] text-[clamp(28px,7vw,44px)] leading-[1.2] hover:text-[var(--site-primary)]"
            >
              <span className="font-[family-name:var(--site-font-body)] text-xs text-[var(--lx-gold)]">{String(index + 1).padStart(2, "0")}</span>
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

type Slide = { image: { src: string; alt: string }; line1: string; line2?: string };

const ARCS = [
  "M300 692 C 330 520, 500 330, 760 312",
  "M0 420 C 120 470, 230 560, 300 692",
  "M1740 0 C 1840 90, 1900 200, 1905 320",
  "M1755 692 C 1840 600, 1940 470, 2000 380",
];

// Full-bleed photo banner with a wipe-in slideshow, slow zoom and two-line headline.
export function Slideshow({ slides }: { slides: Slide[] }) {
  const [active, setActive] = useState(0);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => {
      setStarted(true);
      setActive((index) => (index + 1) % slides.length);
    }, 6500);
    return () => window.clearTimeout(timer);
  }, [active, paused, slides.length]);

  const go = (step: number) => {
    setStarted(true);
    setActive((index) => (index + step + slides.length) % slides.length);
  };
  const slide = slides[active] ?? slides[0]!;

  return (
    <section
      className="relative isolate h-[min(100svh,900px)] min-h-[560px] overflow-hidden bg-[var(--site-text)] text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((item, index) => (
        <div key={`${item.image.src}-${index}`} className={`absolute inset-0 ${index === active ? "z-2" : "z-0 opacity-0"}`} aria-hidden={index !== active}>
          <div key={index === active ? `on-${active}` : "off"} className={`absolute inset-0 ${index === active && started ? "lx-wipe" : ""}`}>
            <div className="lx-kenburns absolute inset-0">
              <img src={item.image.src} alt={item.image.alt} className="size-full object-cover" loading={index === 0 ? "eager" : "lazy"} />
            </div>
          </div>
        </div>
      ))}

      <div className="pointer-events-none absolute inset-0 z-3 bg-[linear-gradient(0deg,rgba(12,9,6,0.62)_0%,rgba(12,9,6,0.3)_45%,rgba(12,9,6,0.38)_100%)]" />

      <svg key={active} viewBox="0 0 2000 692" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 z-3 size-full" aria-hidden="true">
        {ARCS.map((path, index) => (
          <path key={path} d={path} pathLength={1} strokeDasharray={1} strokeDashoffset={1} strokeWidth={1.6} fill="none" stroke="var(--lx-gold-soft)">
            <animate attributeName="stroke-dashoffset" from="1" to="0" dur="2.6s" begin={`${0.4 + index * 0.18}s`} fill="freeze" />
          </path>
        ))}
      </svg>

      <div className="absolute inset-0 z-4 flex flex-col items-center justify-center px-6 text-center">
        <h1 key={active} className="text-[clamp(44px,6.6vw,108px)] leading-[1.06] font-medium text-white">
          <span className="block overflow-hidden pb-[0.04em]">
            <span className="lx-word block">{slide.line1}</span>
          </span>
          {slide.line2 && (
            <span className="block overflow-hidden pb-[0.12em]">
              <span className="lx-word block text-[var(--lx-gold-soft)] [animation-delay:150ms]">{slide.line2}</span>
            </span>
          )}
        </h1>
        <span className="mt-6 h-px w-16 bg-[var(--lx-gold-soft)]" />
      </div>

      {slides.length > 1 && (
        <div className="absolute inset-x-0 bottom-[clamp(28px,6svh,64px)] z-4 flex justify-center gap-3">
          {[
            { label: "Previous slide", step: -1, Icon: ArrowLeft },
            { label: "Next slide", step: 1, Icon: ArrowRight },
          ].map(({ label, step, Icon }) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              onClick={() => go(step)}
              className="grid size-11 place-items-center rounded-full border border-white/40 bg-white/5 text-white backdrop-blur-sm transition-colors hover:bg-[var(--lx-gold-soft)] hover:text-[var(--site-text)]"
            >
              <Icon className="size-4" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

// Counts up to the value once visible. It starts at the final value, so the number is
// correct before scripts run or when motion is reduced.
export function CountUp({ value }: { value: string }) {
  const match = value.match(/^(\D*)([\d,]+)(.*)$/);
  const target = match ? Number(match[2]!.replaceAll(",", "")) : NaN;
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState<number | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || Number.isNaN(target) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / 1800, 1);
          setShown(Math.round(target * (1 - Math.pow(1 - progress, 3))));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [target]);

  if (!match || shown === null) return <span ref={ref}>{value}</span>;
  return (
    <span ref={ref}>
      {match[1]}
      {shown.toLocaleString("en-US")}
      {match[3]}
    </span>
  );
}

type Testimonial = { quote: string; author: string; role?: string };

// A scroll-snap track. It works as a plain horizontal scroll, and the arrows add paging.
export function TestimonialCarousel({ items }: { items: Testimonial[] }) {
  const track = useRef<HTMLDivElement>(null);

  const page = (direction: number) => {
    const element = track.current;
    if (!element) return;
    element.scrollBy({ left: direction * element.clientWidth * 0.9, behavior: "smooth" });
  };

  const arrow =
    "grid size-11 shrink-0 place-items-center rounded-full border border-[var(--site-border)] bg-[var(--site-background)] shadow-md transition-colors hover:bg-[var(--lx-gold)] hover:text-white";

  return (
    <div className="relative mt-12 px-0 sm:px-14">
      <div ref={track} className="lx-scroll-snap flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2" aria-label="Client testimonials">
        {items.map((item) => (
          <figure
            key={`${item.author}-${item.quote.slice(0, 12)}`}
            className="flex w-[85%] shrink-0 snap-start flex-col rounded-2xl border border-[var(--site-border)] bg-[var(--site-background)] p-6 sm:w-[calc((100%-20px)/2)] sm:p-7 lg:w-[calc((100%-40px)/3)]"
          >
            <div className="flex items-center justify-between">
              <span className="flex gap-0.5 text-[var(--lx-gold)]" aria-label="5 stars">
                {[0, 1, 2, 3, 4].map((star) => (
                  <Star key={star} className="size-4" />
                ))}
              </span>
              <Quote className="size-7 text-[var(--site-border)]" />
            </div>
            <blockquote className="mt-5 flex-1 text-[15px] leading-relaxed">&ldquo;{item.quote}&rdquo;</blockquote>
            <figcaption className="mt-7 flex items-center gap-3 border-t border-[var(--site-border)] pt-5">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--site-surface)] font-[family-name:var(--site-font-heading)] text-lg font-semibold text-[var(--site-primary)]">
                {item.author.trim().charAt(0)}
              </span>
              <span className="min-w-0">
                <span className="block font-[family-name:var(--site-font-heading)] text-lg leading-tight font-semibold">{item.author}</span>
                {item.role && <span className="block truncate text-[13px] text-[var(--site-muted)]">{item.role}</span>}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
      {items.length > 1 && (
        <>
          <button type="button" aria-label="Previous testimonials" onClick={() => page(-1)} className={`${arrow} absolute top-1/2 left-0 hidden -translate-y-1/2 sm:grid`}>
            <ArrowLeft className="size-4" />
          </button>
          <button type="button" aria-label="Next testimonials" onClick={() => page(1)} className={`${arrow} absolute top-1/2 right-0 hidden -translate-y-1/2 sm:grid`}>
            <ArrowRight className="size-4" />
          </button>
        </>
      )}
    </div>
  );
}
