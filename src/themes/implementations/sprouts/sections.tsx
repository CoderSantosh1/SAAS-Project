import { Clock, Mail, MapPin, Phone, Sprout, Star } from "lucide-react";
import Link from "next/link";
import { CountUp } from "../../shared/count-up";
import type { SectionComponentProps, ThemeComponents } from "../../types";
import { Bubble, COLORS, colorAt, Doodle, MUTED, Photo, SectionHeading, Wave } from "./ui";

// Little Sprouts' versions of the built-in section types.

export function Features({ props }: SectionComponentProps<"features">) {
  return (
    <section className="bg-[var(--site-background)] py-20 lg:py-28">
      <div className="sp-shell">
        <SectionHeading title={props.heading} text={props.subheading} />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {props.items.map((item, index) => {
            const color = COLORS[colorAt(index)];
            return (
              <div key={`${item.title}-${index}`} className="sp-reveal sp-wiggle rounded-[32px] p-7" style={{ background: color.soft }}>
                <span className="flex size-14 items-center justify-center rounded-2xl text-2xl font-black text-white" style={{ background: color.solid }}>
                  {index + 1}
                </span>
                <h3 className="mt-5 text-xl font-bold">{item.title}</h3>
                <p className={`mt-2 leading-7 ${MUTED}`}>{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Stats({ props }: SectionComponentProps<"stats">) {
  return (
    <section className="bg-[var(--site-background)] py-14">
      <dl className="sp-shell grid grid-cols-2 gap-5 lg:grid-flow-col lg:auto-cols-fr lg:grid-cols-none">
        {props.items.map((item, index) => {
          const color = COLORS[colorAt(index)];
          return (
            <div key={item.label} className="sp-reveal flex flex-col items-center rounded-[32px] border-2 border-[var(--site-text)] bg-white px-4 py-7 text-center shadow-[0_6px_0_var(--site-text)]">
              <dd className="font-[family-name:var(--site-font-heading)] text-4xl font-black sm:text-5xl" style={{ color: "var(--site-text)" }}>
                <CountUp value={item.value} />
              </dd>
              <span className="mt-2 h-1.5 w-10 rounded-full" style={{ background: color.solid }} aria-hidden />
              <dt className={`mt-2 text-sm font-semibold ${MUTED}`}>{item.label}</dt>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

export function Testimonials({ props }: SectionComponentProps<"testimonials">) {
  return (
    <section className="bg-[var(--site-background)]">
      <Wave fill="var(--sp-cream)" />
      <div className="bg-[var(--sp-cream)] py-16 lg:py-24">
        <div className="sp-shell">
          {props.heading && <SectionHeading eyebrow="Happy parents" title={props.heading} />}
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {props.items.map((item, index) => {
              const color = COLORS[colorAt(index + 1)];
              return (
                <figure key={`${item.author}-${index}`} className={`sp-reveal relative ${index % 2 ? "md:translate-y-6" : ""}`}>
                  <blockquote className="relative rounded-[28px] border-2 border-[var(--site-text)] bg-white p-7 leading-7">
                    <span className="mb-3 flex gap-0.5" aria-hidden>
                      {Array.from({ length: 5 }, (_, star) => (
                        <Star key={star} size={16} className="fill-[var(--sp-sun)] text-[var(--sp-sun)]" />
                      ))}
                    </span>
                    {item.quote}
                    <span className="absolute -bottom-3 left-10 size-6 rotate-45 border-r-2 border-b-2 border-[var(--site-text)] bg-white" aria-hidden />
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3 pl-4">
                    <span className="flex size-11 items-center justify-center rounded-full text-lg font-black text-white" style={{ background: color.solid }} aria-hidden>
                      {item.author.slice(0, 1)}
                    </span>
                    <span>
                      <span className="block font-bold">{item.author}</span>
                      {item.role && <span className={`block text-sm ${MUTED}`}>{item.role}</span>}
                    </span>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </div>
      </div>
      <Wave fill="var(--sp-cream)" flip />
    </section>
  );
}

export function Gallery({ props }: SectionComponentProps<"gallery">) {
  return (
    <section className="overflow-hidden bg-[var(--site-background)] py-20 lg:py-28">
      <div className="sp-shell">
        {props.heading && <SectionHeading eyebrow="Our photo wall" title={props.heading} />}
        <div className="mt-14 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {props.images.map((image, index) => (
            <figure
              key={`${image.src}-${index}`}
              className="sp-reveal rounded-md bg-white p-3 pb-4 shadow-[0_12px_30px_rgba(36,50,74,0.14)] transition duration-300 hover:z-10 hover:scale-105 hover:rotate-0"
              style={{ rotate: `${[-3, 2, -1.5, 3, -2, 1.5][index % 6]}deg` }}
            >
              <div className="relative aspect-square overflow-hidden rounded-sm">
                <Photo src={image.src} alt={image.alt} />
              </div>
              {image.caption && <figcaption className="mt-3 text-center font-[family-name:var(--site-font-heading)] text-sm font-bold">{image.caption}</figcaption>}
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
      <div className="sp-shell">
        <div className="sp-reveal relative overflow-hidden rounded-[40px] border-2 border-[var(--site-text)] bg-[var(--sp-sun)] px-6 py-14 text-center text-[#2b2108] shadow-[0_8px_0_var(--site-text)] sm:px-12">
          <Doodle kind="sun" className="sp-spin absolute -top-6 -left-6 size-28 opacity-80" />
          <Doodle kind="dots" className="absolute right-6 bottom-6 size-20" />
          <Doodle kind="star" className="sp-bob absolute top-8 right-[12%] size-10" />
          <h2 className="relative mx-auto max-w-2xl text-[clamp(2rem,4.4vw,3.4rem)] leading-[1.1] font-black">{props.heading}</h2>
          {props.body && <p className="relative mx-auto mt-4 max-w-xl text-lg">{props.body}</p>}
          <div className="relative mt-8">
            <Bubble href={resolveHref(props.button.href)}>{props.button.label}</Bubble>
          </div>
        </div>
      </div>
    </section>
  );
}

// Contact details only. A booking form needs a backend and comes later.
export function Contact({ props }: SectionComponentProps<"contact">) {
  const details = [
    props.phone && { icon: Phone, label: "Call us", value: props.phone, href: `tel:${props.phone.replace(/[^+\d]/g, "")}` },
    props.email && { icon: Mail, label: "Email us", value: props.email, href: `mailto:${props.email}` },
    props.address && { icon: MapPin, label: "Visit us", value: props.address },
    props.hours && { icon: Clock, label: "School hours", value: props.hours },
  ].filter(Boolean) as { icon: typeof Phone; label: string; value: string; href?: string }[];

  return (
    <section className="bg-[var(--site-background)] py-20 lg:py-28">
      <div className="sp-shell">
        <SectionHeading eyebrow="Say hello" title={props.heading} text={props.body} />
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {details.map(({ icon: Icon, label, value, href }, index) => {
            const color = COLORS[colorAt(index)];
            const content = (
              <>
                <span className="flex size-14 items-center justify-center rounded-2xl text-white" style={{ background: color.solid }}>
                  <Icon size={24} aria-hidden />
                </span>
                <span className="mt-4 block font-bold">{label}</span>
                <span className={`mt-1 block break-words ${MUTED}`}>{value}</span>
              </>
            );
            const className = "sp-reveal block h-full rounded-[28px] p-6 text-center transition hover:-translate-y-1 [&>span:first-child]:mx-auto";
            return (
              <li key={label} style={{ background: color.soft }} className="rounded-[28px]">
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
  <footer className="mt-10 bg-[var(--site-background)]">
    <Wave fill="var(--site-text)" />
    <div className="bg-[var(--site-text)] pb-8 text-white">
      <div className="sp-shell grid gap-10 pt-6 md:grid-cols-[1.2fr_2fr]">
        <div>
          <Link href={links[0]?.href ?? "/"} className="inline-flex items-center gap-2.5">
            <span className="flex size-11 -rotate-6 items-center justify-center rounded-2xl bg-[var(--sp-mint)]">
              <Sprout size={24} strokeWidth={2.4} aria-hidden />
            </span>
            <span className="font-[family-name:var(--site-font-heading)] text-xl font-bold">{siteName}</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-7 text-white/70">A happy, safe place to play, learn and grow.</p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-semibold text-white/80 transition hover:text-[var(--sp-sun)]">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <p className="sp-shell mt-10 border-t border-white/10 pt-6 text-xs text-white/60">
        &copy; {new Date().getFullYear()} {siteName}. Made with love for little learners.
      </p>
    </div>
  </footer>
);
