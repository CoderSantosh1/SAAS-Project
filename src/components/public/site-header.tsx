import { Menu } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { brand } from "@/config/brand";
import { PUBLIC_CONTAINER } from "./page-header";

const LINKS = [
  { label: "Features", href: "/features" },
  { label: "Templates", href: "/templates" },
  { label: "Categories", href: "/categories" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface">
      <div className={`${PUBLIC_CONTAINER} flex h-16 items-center justify-between gap-4`}>
        <div className="flex items-center gap-8">
          <Link href="/" className="font-heading text-xl font-bold text-primary">
            {brand.name}
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-6 md:flex">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-secondary-text transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
              Sign in
            </Link>
            <Link href="/register" className={buttonVariants()}>
              Start Building Free
            </Link>
          </div>

          {/* A details element, so the menu also works without JavaScript. */}
          <details className="relative md:hidden">
            <summary
              aria-label="Open menu"
              className={`${buttonVariants({ variant: "secondary" })} cursor-pointer list-none px-3 [&::-webkit-details-marker]:hidden`}
            >
              <Menu className="size-5" aria-hidden />
            </summary>
            <nav
              aria-label="Mobile"
              className="absolute top-12 right-0 flex w-56 flex-col rounded-lg border border-border bg-surface p-2 shadow-card"
            >
              {[...LINKS, { label: "Sign in", href: "/login" }, { label: "Start Building Free", href: "/register" }].map(
                (link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-background"
                  >
                    {link.label}
                  </Link>
                ),
              )}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
