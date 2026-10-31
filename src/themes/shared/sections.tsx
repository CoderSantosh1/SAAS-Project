import { Mail, MapPin, Phone, Clock } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { SectionComponentProps, ThemeComponents } from "../types";

// Building blocks for approved themes. Colors, fonts and corners come from the
// site's CSS variables; each theme picks the layouts that give it its character.

const RADIUS = "rounded-[var(--site-radius)]";
const MUTED = "text-[var(--site-muted)]";
const CONTAINER = "mx-auto w-full max-w-6xl px-5 sm:px-8";

function Section({ children, surface }: { children: ReactNode; surface?: boolean }) {
  return (
    <section className={surface ? "bg-[var(--site-surface)] py-16 sm:py-24" : "py-16 sm:py-24"}>
      <div className={CONTAINER}>{children}</div>
    </section>
  );
}

function SiteButton({
  href,
  children,
  outline,
  resolveHref,
}: {
  href: string;
  children: ReactNode;
  outline?: boolean;
  resolveHref: (href: string) => string;
}) {
  return (
    <Link
      href={resolveHref(href)}
      className={`inline-flex min-h-11 items-center justify-center px-6 py-2.5 text-sm font-semibold transition-opacity hover:opacity-85 ${RADIUS} ${
        outline
          ? "border border-current"
          : "bg-[var(--site-primary)] text-[var(--site-on-primary)]"
      }`}
    >
      {children}
    </Link>
  );
}

function SectionHeading({ heading, subheading }: { heading: string; subheading?: string }) {
  return (
    <div className="mb-10 max-w-2xl">
      <h2 className="text-3xl font-semibold sm:text-4xl">{heading}</h2>
      {subheading && <p className={`mt-3 text-lg ${MUTED}`}>{subheading}</p>}
    </div>
  );
}

function SiteImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  // Sites can use images from any host, so next/image's host allowlist does not fit.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" className={`w-full object-cover ${className ?? ""}`} />;
}

function HeroButtons({ props, resolveHref }: SectionComponentProps<"hero">) {
  if (!props.primaryButton && !props.secondaryButton) return null;
  return (
    <div className="mt-8 flex flex-wrap gap-3">
      {props.primaryButton && (
        <SiteButton href={props.primaryButton.href} resolveHref={resolveHref}>
          {props.primaryButton.label}
        </SiteButton>
      )}
      {props.secondaryButton && (
        <SiteButton href={props.secondaryButton.href} resolveHref={resolveHref} outline>
          {props.secondaryButton.label}
        </SiteButton>
      )}
    </div>
  );
}

export function HeroSplit({ props, resolveHref }: SectionComponentProps<"hero">) {
  return (
    <section className="py-14 sm:py-24">
      <div className={`${CONTAINER} grid items-center gap-10 lg:grid-cols-2`}>
        <div>
          {props.eyebrow && (
            <p className="mb-3 text-sm font-semibold text-[var(--site-primary)]">{props.eyebrow}</p>
          )}
          <h1 className="text-4xl font-bold sm:text-5xl">{props.heading}</h1>
          {props.subheading && <p className={`mt-5 text-lg ${MUTED}`}>{props.subheading}</p>}
          <HeroButtons props={props} resolveHref={resolveHref} />
        </div>
        {props.image && (
          <SiteImage src={props.image.src} alt={props.image.alt} className={`aspect-[4/3] ${RADIUS}`} />
        )}
      </div>
    </section>
  );
}

export function HeroEditorial({ props, resolveHref }: SectionComponentProps<"hero">) {
  return (
    <section className="pt-16 pb-10 sm:pt-28">
      <div className={CONTAINER}>
        {props.eyebrow && (
          <p className={`mb-6 text-sm tracking-[0.2em] uppercase ${MUTED}`}>{props.eyebrow}</p>
        )}
        <h1 className="max-w-5xl text-5xl leading-[1.05] font-medium sm:text-7xl lg:text-8xl">
          {props.heading}
        </h1>
        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          <div />
          <div>
            {props.subheading && <p className={`text-lg ${MUTED}`}>{props.subheading}</p>}
            <HeroButtons props={props} resolveHref={resolveHref} />
          </div>
        </div>
        {props.image && (
          <SiteImage src={props.image.src} alt={props.image.alt} className={`mt-12 aspect-[16/8] ${RADIUS}`} />
        )}
      </div>
    </section>
  );
}

export function HeroOverlay({ props, resolveHref }: SectionComponentProps<"hero">) {
  return (
    <section className="relative isolate flex min-h-[32rem] items-center overflow-hidden py-20 text-center text-white sm:min-h-[40rem]">
      {props.image && (
        <SiteImage src={props.image.src} alt={props.image.alt} className="absolute inset-0 -z-20 h-full" />
      )}
      <div className="absolute inset-0 -z-10 bg-black/60" />
      <div className={`${CONTAINER} flex flex-col items-center`}>
        {props.eyebrow && <p className="mb-4 text-sm tracking-widest uppercase">{props.eyebrow}</p>}
        <h1 className="max-w-3xl text-4xl font-semibold text-white sm:text-6xl">{props.heading}</h1>
        {props.subheading && <p className="mt-5 max-w-xl text-lg text-white/90">{props.subheading}</p>}
        <HeroButtons props={props} resolveHref={resolveHref} />
      </div>
    </section>
  );
}

export function FeaturesCards({ props }: SectionComponentProps<"features">) {
  return (
    <Section surface>
      <SectionHeading heading={props.heading} subheading={props.subheading} />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {props.items.map((item) => (
          <div
            key={item.title}
            className={`border border-[var(--site-border)] bg-[var(--site-background)] p-6 ${RADIUS}`}
          >
            <h3 className="text-lg font-semibold">{item.title}</h3>
            <p className={`mt-2 ${MUTED}`}>{item.description}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function FeaturesNumbered({ props }: SectionComponentProps<"features">) {
  return (
    <Section>
      <SectionHeading heading={props.heading} subheading={props.subheading} />
      <ol className="border-t border-[var(--site-border)]">
        {props.items.map((item, index) => (
          <li
            key={item.title}
            className="grid gap-2 border-b border-[var(--site-border)] py-6 sm:grid-cols-[5rem_1fr_2fr] sm:gap-6"
          >
            <span className={`text-sm ${MUTED}`}>{String(index + 1).padStart(2, "0")}</span>
            <h3 className="text-xl font-medium">{item.title}</h3>
            <p className={MUTED}>{item.description}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

export function FeaturesCentered({ props }: SectionComponentProps<"features">) {
  return (
    <Section surface>
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2 className="text-3xl font-semibold sm:text-4xl">{props.heading}</h2>
        {props.subheading && <p className={`mt-3 text-lg ${MUTED}`}>{props.subheading}</p>}
      </div>
      <div className="grid gap-8 text-center sm:grid-cols-3">
        {props.items.map((item) => (
          <div key={item.title}>
            <h3 className="text-xl font-semibold">{item.title}</h3>
            <p className={`mt-2 ${MUTED}`}>{item.description}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function About({ props }: SectionComponentProps<"about">) {
  return (
    <Section>
      <div className={props.image ? "grid items-center gap-10 lg:grid-cols-2" : "max-w-3xl"}>
        {props.image && (
          <SiteImage src={props.image.src} alt={props.image.alt} className={`aspect-[4/3] ${RADIUS}`} />
        )}
        <div>
          <h2 className="text-3xl font-semibold sm:text-4xl">{props.heading}</h2>
          <p className={`mt-4 text-lg whitespace-pre-line ${MUTED}`}>{props.body}</p>
        </div>
      </div>
    </Section>
  );
}

export function ServicesCards({ props }: SectionComponentProps<"services">) {
  return (
    <Section>
      <SectionHeading heading={props.heading} subheading={props.subheading} />
      <div className="grid gap-5 sm:grid-cols-2">
        {props.items.map((item) => (
          <div key={item.name} className={`bg-[var(--site-surface)] p-6 ${RADIUS}`}>
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-lg font-semibold">{item.name}</h3>
              {item.price && <span className="shrink-0 font-semibold">{item.price}</span>}
            </div>
            {item.description && <p className={`mt-2 ${MUTED}`}>{item.description}</p>}
          </div>
        ))}
      </div>
    </Section>
  );
}

export function ServicesMenu({ props }: SectionComponentProps<"services">) {
  return (
    <Section>
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2 className="text-3xl font-semibold sm:text-4xl">{props.heading}</h2>
        {props.subheading && <p className={`mt-3 text-lg ${MUTED}`}>{props.subheading}</p>}
      </div>
      <ul className="mx-auto grid max-w-4xl gap-x-12 gap-y-6 md:grid-cols-2">
        {props.items.map((item) => (
          <li key={item.name}>
            <div className="flex items-baseline gap-3">
              <h3 className="text-lg font-semibold">{item.name}</h3>
              <span className="min-w-4 flex-1 border-b border-dotted border-[var(--site-muted)]" />
              {item.price && <span className="shrink-0 font-semibold">{item.price}</span>}
            </div>
            {item.description && <p className={`mt-1 text-sm ${MUTED}`}>{item.description}</p>}
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function GalleryGrid({ props }: SectionComponentProps<"gallery">) {
  return (
    <Section>
      {props.heading && <SectionHeading heading={props.heading} />}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {props.images.map((image) => (
          <figure key={image.src}>
            <SiteImage src={image.src} alt={image.alt} className={`aspect-square ${RADIUS}`} />
            {image.caption && <figcaption className={`mt-2 text-sm ${MUTED}`}>{image.caption}</figcaption>}
          </figure>
        ))}
      </div>
    </Section>
  );
}

export function GalleryColumns({ props }: SectionComponentProps<"gallery">) {
  return (
    <Section>
      {props.heading && <SectionHeading heading={props.heading} />}
      <div className="grid gap-x-6 gap-y-12 md:grid-cols-2">
        {props.images.map((image, index) => (
          <figure key={image.src} className={index % 2 === 1 ? "md:mt-20" : undefined}>
            <SiteImage
              src={image.src}
              alt={image.alt}
              className={`${index % 3 === 0 ? "aspect-[4/5]" : "aspect-[4/3]"} ${RADIUS}`}
            />
            {image.caption && <figcaption className={`mt-3 text-sm ${MUTED}`}>{image.caption}</figcaption>}
          </figure>
        ))}
      </div>
    </Section>
  );
}

export function TestimonialsCards({ props }: SectionComponentProps<"testimonials">) {
  return (
    <Section surface>
      {props.heading && <SectionHeading heading={props.heading} />}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {props.items.map((item) => (
          <blockquote
            key={item.author}
            className={`border border-[var(--site-border)] bg-[var(--site-background)] p-6 ${RADIUS}`}
          >
            <p>&ldquo;{item.quote}&rdquo;</p>
            <footer className={`mt-4 text-sm ${MUTED}`}>
              <span className="font-semibold text-[var(--site-text)]">{item.author}</span>
              {item.role && `, ${item.role}`}
            </footer>
          </blockquote>
        ))}
      </div>
    </Section>
  );
}

export function TestimonialsLarge({ props }: SectionComponentProps<"testimonials">) {
  return (
    <Section>
      {props.heading && (
        <h2 className={`mb-10 text-center text-sm font-normal tracking-widest uppercase ${MUTED}`}>
          {props.heading}
        </h2>
      )}
      <div className="mx-auto max-w-3xl space-y-14 text-center">
        {props.items.map((item) => (
          <blockquote key={item.author}>
            <p className="font-[family-name:var(--site-font-heading)] text-2xl sm:text-3xl">
              &ldquo;{item.quote}&rdquo;
            </p>
            <footer className={`mt-4 text-sm ${MUTED}`}>
              {item.author}
              {item.role && `, ${item.role}`}
            </footer>
          </blockquote>
        ))}
      </div>
    </Section>
  );
}

export function Stats({ props }: SectionComponentProps<"stats">) {
  return (
    <section className="bg-[var(--site-primary)] py-12 text-[var(--site-on-primary)]">
      <dl className={`${CONTAINER} grid grid-cols-2 gap-8 text-center md:grid-flow-col md:auto-cols-fr md:grid-cols-none`}>
        {props.items.map((item) => (
          <div key={item.label}>
            <dd className="font-[family-name:var(--site-font-heading)] text-3xl font-bold sm:text-4xl">
              {item.value}
            </dd>
            <dt className="mt-1 text-sm opacity-90">{item.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function Cta({ props, resolveHref }: SectionComponentProps<"cta">) {
  return (
    <Section surface>
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold sm:text-4xl">{props.heading}</h2>
        {props.body && <p className={`mt-3 text-lg ${MUTED}`}>{props.body}</p>}
        <div className="mt-7">
          <SiteButton href={props.button.href} resolveHref={resolveHref}>
            {props.button.label}
          </SiteButton>
        </div>
      </div>
    </Section>
  );
}

// Shows contact details only. A real enquiry form needs a backend and comes later.
export function Contact({ props }: SectionComponentProps<"contact">) {
  const rowClass = "flex items-start gap-3";
  const iconClass = "mt-0.5 size-5 shrink-0 text-[var(--site-primary)]";

  return (
    <Section>
      <SectionHeading heading={props.heading} subheading={props.body} />
      <ul className="grid gap-5 sm:grid-cols-2">
        {props.email && (
          <li className={rowClass}>
            <Mail className={iconClass} aria-hidden />
            <a href={`mailto:${props.email}`} className="break-all hover:underline">{props.email}</a>
          </li>
        )}
        {props.phone && (
          <li className={rowClass}>
            <Phone className={iconClass} aria-hidden />
            <a href={`tel:${props.phone.replace(/[^+\d]/g, "")}`} className="hover:underline">{props.phone}</a>
          </li>
        )}
        {props.address && (
          <li className={rowClass}>
            <MapPin className={iconClass} aria-hidden />
            <span>{props.address}</span>
          </li>
        )}
        {props.hours && (
          <li className={rowClass}>
            <Clock className={iconClass} aria-hidden />
            <span>{props.hours}</span>
          </li>
        )}
      </ul>
    </Section>
  );
}

function SiteLogo({ siteName, logoUrl }: { siteName: string; logoUrl?: string }) {
  if (!logoUrl) return <>{siteName}</>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={logoUrl} alt={siteName} className="inline-block max-h-12 w-auto max-w-48 object-contain" />;
}

export const HeaderBar: ThemeComponents["Header"] = ({ siteName, logoUrl, homeHref, links }) => (
  <header className="border-b border-[var(--site-border)] bg-[var(--site-background)]">
    <div className={`${CONTAINER} flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-4`}>
      <Link href={homeHref} className="font-[family-name:var(--site-font-heading)] text-xl font-bold">
        <SiteLogo siteName={siteName} logoUrl={logoUrl} />
      </Link>
      <nav aria-label="Site" className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="py-1 hover:underline">
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  </header>
);

export const HeaderCentered: ThemeComponents["Header"] = ({ siteName, logoUrl, homeHref, links }) => (
  <header className="bg-[var(--site-background)] py-6 text-center">
    <Link href={homeHref} className="font-[family-name:var(--site-font-heading)] text-3xl font-semibold">
      <SiteLogo siteName={siteName} logoUrl={logoUrl} />
    </Link>
    <nav aria-label="Site" className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-1 px-5 text-sm tracking-wide uppercase">
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="py-1 hover:underline">
          {link.label}
        </Link>
      ))}
    </nav>
  </header>
);

export const FooterSimple: ThemeComponents["Footer"] = ({ siteName }) => (
  <footer className="border-t border-[var(--site-border)] py-8">
    <p className={`${CONTAINER} text-sm ${MUTED}`}>
      &copy; {new Date().getFullYear()} {siteName}
    </p>
  </footer>
);
