/* eslint-disable @next/next/no-img-element -- site images may come from any host */
import Link from "next/link";
import type { SectionComponentProps, ThemeComponents } from "../../types";
import { Clock, Mail, Phone, Pillar, Pin } from "./icons";
import { CountUp, TestimonialCarousel } from "./interactive";
import { GOLD, LINE, MUTED, Photo, PillButton, SectionHeading } from "./ui";

// Lexora's versions of the built-in section types.

export function Hero({ props, resolveHref }: SectionComponentProps<"hero">) {
  return (
    <section className="relative isolate flex min-h-[min(88svh,820px)] items-center overflow-hidden bg-[var(--site-text)] py-24 text-center text-white">
      {props.image && (
        <div className="lx-kenburns absolute inset-0 -z-10">
          <img src={props.image.src} alt={props.image.alt} className="size-full object-cover" />
        </div>
      )}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(12,9,6,0.62)_0%,rgba(12,9,6,0.32)_50%,rgba(12,9,6,0.4)_100%)]" />
      <div className="lx-shell flex flex-col items-center">
        {props.eyebrow && <p className="mb-5 text-[11px] font-medium tracking-[0.3em] text-[var(--lx-gold-soft)] uppercase">{props.eyebrow}</p>}
        <h1 className="max-w-4xl text-[clamp(44px,6.4vw,100px)] leading-[1.06] font-medium text-white">{props.heading}</h1>
        {props.subheading && <p className="mt-6 max-w-xl text-lg text-white/85">{props.subheading}</p>}
        {(props.primaryButton || props.secondaryButton) && (
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            {props.primaryButton && <PillButton href={resolveHref(props.primaryButton.href)} light>{props.primaryButton.label}</PillButton>}
            {props.secondaryButton && (
              <Link href={resolveHref(props.secondaryButton.href)} className="inline-flex min-h-11 items-center rounded-full border border-white/50 px-6 py-3 text-sm font-semibold transition-colors hover:border-[var(--lx-gold-soft)] hover:text-[var(--lx-gold-soft)]">
                {props.secondaryButton.label}
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export function Features({ props }: SectionComponentProps<"features">) {
  return (
    <section className="lx-shell py-20">
      <SectionHeading title={props.heading} />
      {props.subheading && <p className={`lx-reveal mt-5 max-w-xl text-lg ${MUTED}`}>{props.subheading}</p>}
      <ol className={`mt-12 grid gap-px overflow-hidden rounded-2xl border ${LINE} bg-[var(--site-border)] sm:grid-cols-2 lg:grid-cols-4`}>
        {props.items.map((item, index) => (
          <li key={item.title} className="lx-reveal bg-[var(--site-background)] p-8">
            <span className={`font-[family-name:var(--site-font-heading)] text-5xl font-semibold ${GOLD}`}>{String(index + 1).padStart(2, "0")}</span>
            <h3 className="mt-5 text-2xl font-semibold">{item.title}</h3>
            <p className={`mt-2 text-sm leading-7 ${MUTED}`}>{item.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function About({ props }: SectionComponentProps<"about">) {
  return (
    <section className="overflow-hidden py-20">
      <div className="lx-shell grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {props.image && (
          <div className="lx-reveal relative">
            <div className="group relative aspect-[4/5] overflow-hidden rounded-2xl sm:aspect-[5/4]">
              <Photo src={props.image.src} alt={props.image.alt} className="transition-transform duration-1000 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
              <span className="absolute bottom-5 left-5 size-12 rounded-full border border-white/60" />
              <span className="absolute bottom-8 left-8 size-6 rounded-full border border-[var(--lx-gold-soft)]" />
            </div>
            <div className="absolute -top-3 -right-3 size-24 rounded-tr-3xl border-t border-r border-[var(--lx-gold)] sm:-top-4 sm:-right-4" />
          </div>
        )}
        <div className="lx-reveal">
          <h2 className="text-[clamp(40px,5vw,68px)] leading-[1.08] font-medium">{props.heading}</h2>
          <p className={`mt-6 max-w-lg text-base leading-8 whitespace-pre-line sm:text-lg ${MUTED}`}>{props.body}</p>
        </div>
      </div>
    </section>
  );
}

export function Services({ props }: SectionComponentProps<"services">) {
  return (
    <section className="lx-shell py-20">
      <SectionHeading title={props.heading} />
      {props.subheading && <p className={`lx-reveal mt-5 max-w-xl text-lg ${MUTED}`}>{props.subheading}</p>}
      <ul className={`mt-12 grid border-t ${LINE} md:grid-cols-2 md:gap-x-12`}>
        {props.items.map((item) => (
          <li key={item.name} className={`lx-reveal flex gap-6 border-b ${LINE} py-7`}>
            <span className="mt-2 h-px w-8 shrink-0 bg-[var(--lx-gold)]" />
            <div className="flex-1">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-2xl font-semibold">{item.name}</h3>
                {item.price && <span className={`shrink-0 font-semibold ${GOLD}`}>{item.price}</span>}
              </div>
              {item.description && <p className={`mt-2 text-sm leading-7 ${MUTED}`}>{item.description}</p>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Gallery({ props }: SectionComponentProps<"gallery">) {
  return (
    <section className="lx-shell py-20">
      {props.heading && <SectionHeading title={props.heading} />}
      <div className="mt-12 columns-1 gap-4 sm:columns-2 lg:columns-3">
        {props.images.map((image, index) => (
          <figure key={`${image.src}-${index}`} className="lx-reveal group relative mb-4 break-inside-avoid overflow-hidden rounded-2xl">
            <img
              src={image.src}
              alt={image.alt}
              loading="lazy"
              className={`w-full object-cover transition-transform duration-[1200ms] group-hover:scale-105 ${index % 3 === 1 ? "aspect-[3/4]" : "aspect-[4/3]"}`}
            />
            {image.caption && (
              <figcaption className="absolute bottom-3 left-3 rounded-full bg-[color-mix(in_srgb,var(--site-background)_92%,transparent)] px-3 py-1 text-[11px] font-medium">
                {image.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </section>
  );
}

export function Testimonials({ props }: SectionComponentProps<"testimonials">) {
  return (
    <section className="bg-[var(--site-surface)] py-20">
      <div className="lx-shell">
        {props.heading && <SectionHeading title={props.heading} center />}
        <TestimonialCarousel items={props.items} />
      </div>
    </section>
  );
}

export function Stats({ props }: SectionComponentProps<"stats">) {
  return (
    <section className="lx-shell">
      <dl className="grid grid-cols-2 lg:grid-flow-col lg:auto-cols-fr lg:grid-cols-none">
        {props.items.map((item, index) => (
          <div
            key={item.label}
            className={`lx-reveal py-16 text-center ${index % 2 ? `border-l ${LINE}` : ""} ${index > 1 ? `border-t ${LINE} lg:border-t-0` : ""} ${index > 0 ? `lg:border-l ${LINE}` : ""}`}
          >
            <dd className={`font-[family-name:var(--site-font-heading)] text-[clamp(48px,5vw,72px)] leading-none font-semibold ${GOLD}`}>
              <CountUp value={item.value} />
            </dd>
            <dt className={`mt-3 text-[11px] tracking-[0.28em] uppercase ${MUTED}`}>{item.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function Cta({ props, resolveHref }: SectionComponentProps<"cta">) {
  return (
    <section className="relative isolate overflow-hidden bg-[var(--site-text)] py-20 text-center text-[var(--site-background)]">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_80%_at_50%_120%,color-mix(in_srgb,var(--site-primary)_45%,transparent),transparent)]" />
      <div className="lx-shell lx-reveal mx-auto max-w-2xl">
        <h2 className="text-[clamp(32px,4.5vw,56px)] leading-[1.08] font-medium text-[var(--site-background)]">{props.heading}</h2>
        {props.body && <p className="mt-4 text-lg opacity-80">{props.body}</p>}
        <div className="mt-8">
          <PillButton href={resolveHref(props.button.href)} light>
            {props.button.label}
          </PillButton>
        </div>
      </div>
    </section>
  );
}

// Shows contact details only. An enquiry form needs a backend and comes later.
export function Contact({ props }: SectionComponentProps<"contact">) {
  const details = [
    props.phone && { icon: Phone, label: props.phone, href: `tel:${props.phone.replace(/[^+\d]/g, "")}` },
    props.email && { icon: Mail, label: props.email, href: `mailto:${props.email}` },
    props.address && { icon: Pin, label: props.address },
    props.hours && { icon: Clock, label: props.hours },
  ].filter(Boolean) as { icon: typeof Phone; label: string; href?: string }[];

  return (
    <section className="lx-shell py-20">
      <SectionHeading title={props.heading} />
      {props.body && <p className={`lx-reveal mt-5 max-w-xl text-lg ${MUTED}`}>{props.body}</p>}
      <ul className="mt-12 grid gap-4 sm:grid-cols-2">
        {details.map(({ icon: Icon, label, href }) => {
          const content = (
            <>
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--site-surface)] text-[var(--lx-gold)]">
                <Icon className="size-5" />
              </span>
              <span className="text-sm break-words">{label}</span>
            </>
          );
          const className = `lx-reveal flex items-center gap-4 rounded-xl border ${LINE} bg-[var(--site-background)] p-4`;
          return (
            <li key={label}>
              {href ? (
                <a href={href} className={`${className} transition-colors hover:border-[var(--lx-gold)]`}>
                  {content}
                </a>
              ) : (
                <div className={className}>{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export const Footer: ThemeComponents["Footer"] = ({ siteName, links = [] }) => (
  <footer className="bg-[var(--site-surface)]">
    <div className="lx-shell">
      <div className={`grid gap-10 border-b ${LINE} py-16 md:grid-cols-[1.4fr_2fr]`}>
        <div>
          <p className="inline-flex items-center gap-3">
            <Pillar className="size-9 text-[var(--lx-gold)]" />
            <span className="font-[family-name:var(--site-font-heading)] text-[27px] leading-none font-semibold">{siteName}</span>
          </p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm opacity-80 transition-colors hover:text-[var(--site-primary)] hover:opacity-100">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <p className={`py-8 text-xs ${MUTED}`}>
        &copy; {new Date().getFullYear()} {siteName}. All rights reserved.
      </p>
    </div>
  </footer>
);
