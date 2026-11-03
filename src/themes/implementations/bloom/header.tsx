"use client";

/* eslint-disable @next/next/no-img-element -- site images may come from any host */
import { CalendarDays, Heart, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { ThemeComponents } from "../../types";

export const BloomHeader: ThemeComponents["Header"] = ({ siteName, logoUrl, homeHref, links }) => {
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
    <header className="sticky top-0 z-50 w-full border-b border-[var(--site-border)] bg-[color-mix(in_srgb,white_88%,transparent)] backdrop-blur-xl">
      <div className="bl-shell flex h-[76px] items-center justify-between gap-4">
        <Link href={homeHref} className="group flex shrink-0 items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt={siteName} className="h-11 w-auto max-w-44 object-contain" />
          ) : (
            <>
              <span className="flex size-11 items-center justify-center rounded-2xl bg-[var(--bl-petal)] text-[var(--bl-brand)] transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110">
                <Heart size={24} strokeWidth={1.8} aria-hidden />
              </span>
              <span className="font-[family-name:var(--site-font-heading)] text-xl font-semibold tracking-tight">{siteName}</span>
            </>
          )}
        </Link>

        <nav aria-label="Site" className="hidden items-center gap-6 lg:flex xl:gap-8">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="group relative text-sm font-medium whitespace-nowrap opacity-85 transition hover:text-[var(--site-primary)] hover:opacity-100">
              {link.label}
              <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-[var(--bl-brand)] transition-transform duration-300 group-hover:scale-x-100" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {contact && (
            <Link
              href={contact.href}
              className="group hidden items-center gap-2 rounded-full bg-[var(--site-primary)] px-5 py-3 text-sm font-semibold whitespace-nowrap text-[var(--site-on-primary)] shadow-md transition hover:-translate-y-0.5 sm:flex"
            >
              <CalendarDays size={17} className="transition-transform group-hover:rotate-12" aria-hidden />
              Book Consultation
            </Link>
          )}
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="flex size-11 items-center justify-center rounded-xl border border-[var(--site-border)] lg:hidden"
          >
            {open ? <X size={23} aria-hidden /> : <Menu size={23} aria-hidden />}
          </button>
        </div>
      </div>

      {open && (
        <nav aria-label="Mobile" className="bl-shell flex flex-col border-t border-[var(--site-border)] bg-white pt-3 pb-6 lg:hidden">
          {links.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="border-b border-[var(--bl-petal)] py-3.5 text-sm font-medium">
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
};
