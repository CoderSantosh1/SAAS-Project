"use client";

/* eslint-disable @next/next/no-img-element -- site images may come from any host */
import { Menu, Megaphone, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { ThemeComponents } from "../../types";
import type { ComponentProps } from "react";
import { findCtaLink } from "../../shared/links";
import { CRESTVIEW_COPY, type CrestviewCopy } from "./copy";
import { Mark } from "./ui";

type HeaderProps = ComponentProps<ThemeComponents["Header"]> & { copy?: CrestviewCopy };

export function CrestviewHeader({ siteName, logoUrl, homeHref, links, copy = CRESTVIEW_COPY }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const contact = findCtaLink(links, copy.ctaPages);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 w-full">
      {contact && (
        <div className="bg-[var(--cv-deep)] text-white">
          <div className="cv-shell flex h-10 items-center justify-center gap-2 text-xs sm:justify-between">
            <span className="flex items-center gap-2">
              <Megaphone size={14} className="text-[var(--cv-gold)]" aria-hidden />
              {copy.announcement}
            </span>
            <Link href={contact.href} className="hidden font-semibold text-[var(--cv-gold)] hover:underline sm:inline">
              {copy.barCta}
            </Link>
          </div>
        </div>
      )}
      <div className="border-b border-[var(--site-border)] bg-[var(--site-background)]/95 backdrop-blur">
        <div className="cv-shell flex h-20 items-center justify-between gap-4">
          <Link href={homeHref} className="flex min-w-0 items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={siteName} className="h-12 w-auto max-w-44 object-contain" />
            ) : (
              <>
                <Mark icon={copy.mark} className="h-11 w-10 shrink-0" />
                <span className="truncate font-[family-name:var(--site-font-heading)] text-xl font-semibold">{siteName}</span>
              </>
            )}
          </Link>

          <nav aria-label="Site" className="hidden items-center gap-1 lg:flex">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition hover:bg-[var(--cv-tint)] hover:text-[var(--site-primary)]">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {contact && (
              <Link href={contact.href} className="hidden rounded-[var(--site-radius)] bg-[var(--site-primary)] px-5 py-3 text-sm font-semibold whitespace-nowrap text-[var(--site-on-primary)] transition hover:bg-[var(--cv-deep)] sm:inline-flex">
                {copy.headerCta}
              </Link>
            )}
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className="flex size-11 items-center justify-center rounded-md border border-[var(--site-border)] lg:hidden"
            >
              {open ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
            </button>
          </div>
        </div>

        {open && (
          <nav aria-label="Mobile" className="cv-shell flex flex-col border-t border-[var(--site-border)] pt-2 pb-5 lg:hidden">
            {links.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="border-b border-[var(--site-border)] py-3.5 text-sm font-medium">
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
