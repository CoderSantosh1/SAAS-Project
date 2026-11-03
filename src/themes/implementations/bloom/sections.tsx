import { Clock, Heart, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { CountUp } from "../../shared/count-up";
import type { SectionComponentProps, ThemeComponents } from "../../types";
import { DEEP, LINE, MUTED, Photo, PillLink, SectionHeading } from "./ui";

// Bloom's versions of the built-in section types that it styles itself. The rest use the
// shared building blocks, recolored by the theme's tokens.

export function Hero({ props, resolveHref }: SectionComponentProps<"hero">) {
  return (
    <section className="relative isolate flex min-h-[560px] items-end overflow-hidden bg-[var(--site-text)] text-white">
      {props.image && (
        <div className="bl-zoom-in absolute inset-0 -z-10">
          <Photo src={props.image.src} alt={props.image.alt} />
        </div>
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[color-mix(in_srgb,var(--bl-ink-shade)_88%,transparent)] via-[color-mix(in_srgb,var(--bl-ink-shade)_35%,transparent)] to-transparent" />
      <div className="bl-shell pt-32 pb-16">
        {props.eyebrow && <p className="mb-4 inline-flex items-center gap-3 text-[11px] font-semibold tracking-[0.3em] text-white/85 uppercase"><span className="h-px w-10 bg-white/60" />{props.eyebrow}</p>}
        <h1 className="max-w-4xl text-[clamp(2.6rem,7vw,6rem)] leading-[1] font-medium text-white">{props.heading}</h1>
        {props.subheading && <p className="mt-5 max-w-xl text-lg text-white/85">{props.subheading}</p>}
        {props.primaryButton && (
          <div className="mt-8">
            <PillLink href={resolveHref(props.primaryButton.href)} light>
              {props.primaryButton.label}
            </PillLink>
          </div>
        )}
      </div>
    </section>
  );
}

export function Stats({ props }: SectionComponentProps<"stats">) {
  return (
    <section className="bg-[var(--site-primary)] py-14 text-[var(--site-on-primary)] lg:py-20">
      <dl className="bl-shell grid grid-cols-2 gap-y-10 lg:grid-flow-col lg:auto-cols-fr lg:grid-cols-none">
        {props.items.map((item, index) => (
          <div key={item.label} className={`bl-reveal text-center ${index > 0 ? "lg:border-l lg:border-white/25" : ""}`}>
            <dd className="font-[family-name:var(--site-font-heading)] text-5xl font-medium sm:text-6xl">
              <CountUp value={item.value} />
            </dd>
            <dt className="mt-2 text-xs font-semibold tracking-[0.22em] uppercase opacity-85">{item.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function Cta({ props, resolveHref }: SectionComponentProps<"cta">) {
  return (
    <section className="bg-[var(--bl-petal)] py-20 lg:py-28">
      <div className="bl-shell bl-reveal text-center">
        <h2 className="mx-auto max-w-3xl text-[clamp(2.4rem,5vw,4.5rem)] leading-[1.05] font-medium">{props.heading}</h2>
        {props.body && <p className={`mx-auto mt-4 max-w-xl text-lg ${MUTED}`}>{props.body}</p>}
        <div className="mt-8">
          <PillLink href={resolveHref(props.button.href)}>{props.button.label}</PillLink>
        </div>
      </div>
    </section>
  );
}

// Contact details only. A booking form needs a backend and comes later.
export function Contact({ props }: SectionComponentProps<"contact">) {
  const details = [
    props.phone && { icon: Phone, label: "Call Us", value: props.phone, href: `tel:${props.phone.replace(/[^+\d]/g, "")}` },
    props.email && { icon: Mail, label: "Email", value: props.email, href: `mailto:${props.email}` },
    props.address && { icon: MapPin, label: "Visit", value: props.address },
    props.hours && { icon: Clock, label: "Hours", value: props.hours },
  ].filter(Boolean) as { icon: typeof Phone; label: string; value: string; href?: string }[];

  return (
    <section className="bg-[var(--site-background)] py-20 lg:py-28">
      <div className="bl-shell">
        <SectionHeading title={props.heading} left />
        {props.body && <p className={`bl-reveal mt-4 max-w-xl text-lg ${MUTED}`}>{props.body}</p>}
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {details.map(({ icon: Icon, label, value, href }) => {
            const content = (
              <>
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--bl-petal)] text-[var(--bl-brand)] transition-colors duration-300 group-hover:bg-[var(--site-primary)] group-hover:text-white">
                  <Icon size={21} aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className={`block text-[11px] font-semibold tracking-[0.2em] uppercase ${DEEP}`}>{label}</span>
                  <span className="mt-1 block text-sm font-medium break-words">{value}</span>
                </span>
              </>
            );
            const className = `bl-reveal group flex h-full items-start gap-4 rounded-[24px] border ${LINE} bg-white p-5 transition hover:-translate-y-1`;
            return (
              <li key={label}>
                {href ? <a href={href} className={className}>{content}</a> : <div className={className}>{content}</div>}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export const Footer: ThemeComponents["Footer"] = ({ siteName, links = [] }) => (
  <footer className="bg-[var(--site-background)]">
    <div className="bl-shell pt-16 pb-6 lg:pt-20">
      <div className={`grid gap-10 border-b ${LINE} pb-12 md:grid-cols-[1.2fr_2fr]`}>
        <div>
          <Link href={links[0]?.href ?? "/"} className="inline-flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-[var(--bl-petal)] text-[var(--bl-brand)]">
              <Heart size={26} strokeWidth={1.8} aria-hidden />
            </span>
            <span className="font-[family-name:var(--site-font-heading)] text-xl font-semibold tracking-tight">{siteName}</span>
          </Link>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={`text-sm transition hover:text-[var(--site-primary)] ${MUTED}`}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <p className={`pt-6 text-xs ${MUTED}`}>
        &copy; {new Date().getFullYear()} {siteName}. All rights reserved.
      </p>
    </div>
  </footer>
);
