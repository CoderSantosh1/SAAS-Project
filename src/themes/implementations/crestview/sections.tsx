import { Clock, Mail, MapPin, Phone, Quote } from "lucide-react";
import Link from "next/link";
import { CountUp } from "../../shared/count-up";
import type { SectionComponentProps, ThemeComponents } from "../../types";
import type { ComponentProps } from "react";
import { CRESTVIEW_COPY, type CrestviewCopy } from "./copy";
import { ActionLink, Crest, LINE, Mark, MUTED, Photo, SectionHeading } from "./ui";

type WithCopy = { copy?: CrestviewCopy };

// Crestview's versions of the built-in section types. The rest use the shared building
// blocks, recolored by the theme's tokens.

export function Features({ props }: SectionComponentProps<"features">) {
  return (
    <section className="bg-[var(--site-background)] py-20 lg:py-28">
      <div className="cv-shell">
        <SectionHeading title={props.heading} text={props.subheading} center />
        <div className="mt-14 grid gap-px overflow-hidden rounded-[var(--site-radius)] border border-[var(--site-border)] bg-[var(--site-border)] sm:grid-cols-2 lg:grid-cols-3">
          {props.items.map((item, index) => (
            <div key={`${item.title}-${index}`} className="cv-reveal group bg-[var(--site-background)] p-8 transition hover:bg-[var(--cv-tint)]">
              <span className="font-[family-name:var(--site-font-heading)] text-4xl font-semibold text-[var(--cv-gold)]">{String(index + 1).padStart(2, "0")}</span>
              <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
              <p className={`mt-2 leading-7 ${MUTED}`}>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Stats({ props }: SectionComponentProps<"stats">) {
  return (
    <section className="relative overflow-hidden bg-[var(--cv-deep)] py-16 text-white lg:py-20">
      <Crest className="pointer-events-none absolute -top-10 -right-10 h-72 w-64 opacity-[0.07]" />
      <dl className="cv-shell grid grid-cols-2 gap-y-10 lg:grid-flow-col lg:auto-cols-fr lg:grid-cols-none">
        {props.items.map((item, index) => (
          <div key={item.label} className={`cv-reveal px-4 text-center ${index > 0 ? "lg:border-l lg:border-white/15" : ""}`}>
            <dd className="font-[family-name:var(--site-font-heading)] text-5xl font-semibold text-[var(--cv-gold)] sm:text-6xl">
              <CountUp value={item.value} />
            </dd>
            <dt className="mt-2 text-sm tracking-wide text-white/80">{item.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function Testimonials({ props, copy = CRESTVIEW_COPY }: SectionComponentProps<"testimonials"> & WithCopy) {
  const [first, ...rest] = props.items;
  return (
    <section className="bg-[var(--cv-tint)] py-20 lg:py-28">
      <div className="cv-shell">
        {props.heading && <SectionHeading eyebrow={copy.testimonialsEyebrow} title={props.heading} center />}
        <div className="mt-12 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {first && (
            <figure className="cv-reveal relative rounded-[var(--site-radius)] bg-[var(--site-primary)] p-8 text-[var(--site-on-primary)] sm:p-12">
              <Quote size={44} className="text-[var(--cv-gold)]" aria-hidden />
              <blockquote className="mt-6 font-[family-name:var(--site-font-heading)] text-2xl leading-snug sm:text-3xl">{first.quote}</blockquote>
              <figcaption className="mt-8 text-sm">
                <span className="font-semibold">{first.author}</span>
                {first.role && <span className="opacity-75"> · {first.role}</span>}
              </figcaption>
            </figure>
          )}
          <div className="grid gap-6">
            {rest.map((item, index) => (
              <figure key={`${item.author}-${index}`} className={`cv-reveal rounded-[var(--site-radius)] border ${LINE} bg-[var(--site-background)] p-7`}>
                <blockquote className="leading-7">“{item.quote}”</blockquote>
                <figcaption className="mt-4 text-sm">
                  <span className="font-semibold">{item.author}</span>
                  {item.role && <span className={MUTED}> · {item.role}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Gallery({ props, copy = CRESTVIEW_COPY }: SectionComponentProps<"gallery"> & WithCopy) {
  return (
    <section className="bg-[var(--site-background)] py-20 lg:py-28">
      <div className="cv-shell">
        {props.heading && <SectionHeading eyebrow={copy.galleryEyebrow} title={props.heading} center />}
        <div className="mt-12 grid auto-rows-[200px] grid-cols-2 gap-3 sm:auto-rows-[240px] lg:grid-cols-4">
          {props.images.map((image, index) => (
            <figure key={`${image.src}-${index}`} className={`cv-reveal group relative overflow-hidden rounded-[var(--site-radius)] ${index % 5 === 0 ? "col-span-2 row-span-2" : ""}`}>
              <Photo src={image.src} alt={image.alt} className="transition-transform duration-700 group-hover:scale-105" />
              {image.caption && (
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-10 text-sm font-medium text-white">{image.caption}</figcaption>
              )}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Cta({ props, resolveHref }: SectionComponentProps<"cta">) {
  return (
    <section className="bg-[var(--site-background)] py-16 lg:py-20">
      <div className="cv-shell">
        <div className="cv-reveal relative flex flex-col items-start gap-6 overflow-hidden rounded-[var(--site-radius)] bg-[var(--site-primary)] p-8 text-[var(--site-on-primary)] sm:p-12 lg:flex-row lg:items-center lg:justify-between">
          <Crest className="pointer-events-none absolute -bottom-16 -left-10 h-64 w-56 opacity-10" />
          <div className="relative max-w-2xl">
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">{props.heading}</h2>
            {props.body && <p className="mt-3 text-lg text-white/80">{props.body}</p>}
          </div>
          <div className="relative">
            <ActionLink href={resolveHref(props.button.href)} variant="light">
              {props.button.label}
            </ActionLink>
          </div>
        </div>
      </div>
    </section>
  );
}

// Contact details only. An enquiry form needs a backend and comes later.
export function Contact({ props, copy = CRESTVIEW_COPY }: SectionComponentProps<"contact"> & WithCopy) {
  const labels = copy.contactLabels;
  const details = [
    props.phone && { icon: Phone, label: labels.phone, value: props.phone, href: `tel:${props.phone.replace(/[^+\d]/g, "")}` },
    props.email && { icon: Mail, label: labels.email, value: props.email, href: `mailto:${props.email}` },
    props.address && { icon: MapPin, label: labels.address, value: props.address },
    props.hours && { icon: Clock, label: labels.hours, value: props.hours },
  ].filter(Boolean) as { icon: typeof Phone; label: string; value: string; href?: string }[];

  return (
    <section className="bg-[var(--site-background)] py-20 lg:py-28">
      <div className="cv-shell grid gap-12 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <SectionHeading eyebrow={copy.contactEyebrow} title={props.heading} text={props.body} />
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {details.map(({ icon: Icon, label, value, href }) => {
            const content = (
              <>
                <span className="flex size-12 items-center justify-center rounded-full bg-[var(--cv-tint)] text-[var(--site-primary)]">
                  <Icon size={20} aria-hidden />
                </span>
                <span className="mt-4 block text-xs font-semibold tracking-[0.18em] text-[var(--site-primary)] uppercase">{label}</span>
                <span className="mt-1 block font-medium break-words">{value}</span>
              </>
            );
            const className = `cv-reveal block h-full rounded-[var(--site-radius)] border ${LINE} bg-white p-6 transition hover:border-[var(--cv-gold)]`;
            return <li key={label}>{href ? <a href={href} className={className}>{content}</a> : <div className={className}>{content}</div>}</li>;
          })}
        </ul>
      </div>
    </section>
  );
}

export const Footer = ({ siteName, links = [], copy = CRESTVIEW_COPY }: ComponentProps<ThemeComponents["Footer"]> & WithCopy) => (
  <footer className="bg-[var(--cv-deep)] text-white">
    <div className="cv-shell grid gap-10 py-16 md:grid-cols-[1.3fr_1fr]">
      <div>
        <Link href={links[0]?.href ?? "/"} className="inline-flex items-center gap-3">
          <Mark icon={copy.mark} className="h-12 w-11" />
          <span className="font-[family-name:var(--site-font-heading)] text-2xl font-semibold">{siteName}</span>
        </Link>
        <p className="mt-4 max-w-sm text-sm leading-7 text-white/70">{copy.footerTagline}</p>
      </div>
      <nav aria-label="Footer">
        <p className="text-xs font-semibold tracking-[0.2em] text-[var(--cv-gold)] uppercase">{copy.footerHeading}</p>
        <ul className="mt-4 grid grid-cols-2 gap-3">
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="text-sm text-white/80 transition hover:text-white">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
    <p className="cv-shell border-t border-white/10 py-6 text-xs text-white/60">
      &copy; {new Date().getFullYear()} {siteName}. All rights reserved.
    </p>
  </footer>
);
