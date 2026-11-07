import { CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { brand } from "@/config/brand";

const USER_POINTS = ["50+ designs for every kind of business", "Click on any text to change it", "No code, no design skills needed"];
const ADMIN_POINTS = ["Review and publish themes", "Manage users, websites and support", "Every action is logged"];

// Sign-in and sign-up pages: a brand panel on wide screens and the form beside it.
export function AuthCard({
  title,
  description,
  children,
  footer,
  variant = "user",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  variant?: "user" | "admin";
}) {
  const admin = variant === "admin";
  const points = admin ? ADMIN_POINTS : USER_POINTS;

  return (
    <main className="ui-glass grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <section
        aria-hidden
        className="relative hidden overflow-hidden bg-gradient-to-br from-[#2a1f8f] via-primary-hover to-brand-blue p-12 text-white lg:flex lg:flex-col lg:justify-between"
      >
        <div className="pointer-events-none absolute -top-32 -left-24 size-96 rounded-full bg-primary/50 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 -bottom-32 size-96 rounded-full bg-accent/30 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(white 1px, transparent 1px)", backgroundSize: "24px 24px" }}
        />
        <p className="relative flex items-center gap-2.5 font-heading text-xl font-bold">
          <span className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-base shadow-lg shadow-primary/40">
            {brand.name.slice(0, 1)}
          </span>
          {brand.name}
          {admin && <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-accent uppercase">Admin</span>}
        </p>
        <div className="relative max-w-md">
          <p className="font-heading text-4xl leading-tight font-semibold text-white">{admin ? "Run the platform with confidence." : brand.tagline}</p>
          <ul className="mt-8 space-y-3">
            {points.map((point) => (
              <li key={point} className="flex items-center gap-3 text-white/80">
                {admin ? <ShieldCheck className="size-5 shrink-0 text-accent" /> : <CheckCircle2 className="size-5 shrink-0 text-accent" />}
                {point}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-white/50">&copy; {new Date().getFullYear()} {brand.name}</p>
      </section>

      <div className="flex flex-col items-center justify-center px-4 py-10 sm:px-8">
        <Link href="/" className="mb-8 flex items-center gap-2 font-heading text-2xl font-bold text-navy lg:hidden">
          <span className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-base text-white" aria-hidden>
            {brand.name.slice(0, 1)}
          </span>
          {brand.name}
        </Link>
        <div className="w-full max-w-md">
          <div className="glass rounded-3xl border border-border bg-surface p-6 shadow-elevated sm:p-8">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {description && <p className="mt-1.5 text-sm text-secondary-text">{description}</p>}
            <div className="mt-6">{children}</div>
          </div>
          {footer && <div className="mt-5 text-center text-sm text-secondary-text">{footer}</div>}
        </div>
      </div>
    </main>
  );
}
