"use client";

/* eslint-disable @next/next/no-img-element -- site images may come from any host */
import { Menu, Sprout, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { ThemeComponents } from "../../types";

export const SproutsHeader: ThemeComponents["Header"] = ({ siteName, logoUrl, homeHref, links }) => {
  const [open, setOpen] = useState(false);
  const contact = links.find((link) => /\/(contact|enroll|admissions)$/.test(link.href));

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 w-full px-3 pt-3">
      <div className="sp-shell rounded-full border-2 border-[var(--site-text)] bg-white/95 shadow-[0_5px_0_var(--site-text)] backdrop-blur">
        <div className="flex h-16 items-center justify-between gap-3">
          <Link href={homeHref} className="flex min-w-0 items-center gap-2.5">
            {logoUrl ? (
              <img src={logoUrl} alt={siteName} className="h-10 w-auto max-w-40 object-contain" />
            ) : (
              <>
                <span className="flex size-10 shrink-0 -rotate-6 items-center justify-center rounded-2xl bg-[var(--sp-mint)] text-white">
                  <Sprout size={22} strokeWidth={2.4} aria-hidden />
                </span>
                <span className="truncate font-[family-name:var(--site-font-heading)] text-lg font-bold">{siteName}</span>
              </>
            )}
          </Link>

          <nav aria-label="Site" className="hidden items-center gap-1 lg:flex">
            {links.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-3.5 py-2 text-sm font-semibold whitespace-nowrap transition hover:bg-[var(--hover)]"
                style={{ "--hover": ["#FFF1C7", "#FFE1D8", "#D7F5EC", "#E8E1FC", "#DCEFFF"][index % 5] } as React.CSSProperties}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {contact && (
              <Link href={contact.href} className="hidden rounded-full bg-[var(--site-primary)] px-5 py-2.5 text-sm font-bold whitespace-nowrap text-[var(--site-on-primary)] transition hover:-translate-y-0.5 sm:inline-flex">
                Enroll Now
              </Link>
            )}
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className="flex size-11 items-center justify-center rounded-full border-2 border-[var(--site-text)] lg:hidden"
            >
              {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
            </button>
          </div>
        </div>
      </div>
      {open && (
        <nav aria-label="Mobile" className="sp-shell mt-2 flex flex-col rounded-3xl border-2 border-[var(--site-text)] bg-white p-3 lg:hidden">
          {links.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="rounded-2xl px-4 py-3 text-base font-semibold hover:bg-[var(--sp-cream)]">
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
};
