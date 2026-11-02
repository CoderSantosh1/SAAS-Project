import Link from "next/link";
import { z } from "zod";
import { defineSection, fieldSchemas as f } from "../../types";
import { ArrowRight, PRACTICE_ICONS, PracticeIcon } from "./icons";
import { Slideshow } from "./interactive";
import { Eyebrow, GOLD, LINE, MUTED, Photo, SectionHeading, TextLink } from "./ui";

// Section types only Lexora offers. Each one is a schema (what content is allowed), the
// editor fields for it, starter content, and the component that renders it.

const PLACEHOLDER = { src: "/themes/lexora/boardroom.jpg", alt: "Office" };

const heading = {
  eyebrow: f.shortText.optional(),
  title: f.shortText,
  accent: f.shortText.optional(),
};

const headingFields = [
  { kind: "text" as const, key: "eyebrow", label: "Small heading" },
  { kind: "text" as const, key: "title", label: "Heading" },
  { kind: "text" as const, key: "accent", label: "Gold italic words" },
];

export const slideshow = defineSection({
  label: "Slideshow banner",
  providesPageHeading: true,
  schema: z.object({
    slides: z.array(z.object({ image: f.image, line1: f.shortText, line2: f.shortText.optional() })).min(1).max(6),
  }),
  fields: [
    {
      kind: "list",
      key: "slides",
      label: "Slides",
      itemLabel: "Slide",
      newItem: { image: PLACEHOLDER, line1: "Your headline", line2: "In gold" },
      fields: [
        { kind: "image", key: "image", label: "Photo" },
        { kind: "text", key: "line1", label: "First line" },
        { kind: "text", key: "line2", label: "Second line (gold)" },
      ],
    },
  ],
  defaults: { slides: [{ image: PLACEHOLDER, line1: "Your headline", line2: "In gold" }] },
  component: ({ props }) => <Slideshow slides={props.slides} />,
});

export const pageHero = defineSection({
  label: "Page banner",
  providesPageHeading: true,
  schema: z.object({ eyebrow: f.shortText.optional(), title: f.shortText, line: f.longText.optional(), image: f.image }),
  fields: [
    { kind: "text", key: "eyebrow", label: "Small heading" },
    { kind: "text", key: "title", label: "Page title" },
    { kind: "textarea", key: "line", label: "Short line" },
    { kind: "image", key: "image", label: "Photo" },
  ],
  defaults: { title: "Page title", line: "A short line about this page.", image: PLACEHOLDER },
  component: ({ props }) => (
    <section className="lx-shell pt-8">
      <div className="relative h-[min(70svh,680px)] min-h-[420px] overflow-hidden rounded-2xl">
        <div className="lx-zoom-out absolute inset-0">
          <Photo src={props.image.src} alt={props.image.alt} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
        <div className="lx-card-rise absolute bottom-4 left-4 max-w-[calc(100%-2rem)] rounded-xl bg-[color-mix(in_srgb,var(--site-background)_95%,transparent)] p-6 backdrop-blur-sm sm:bottom-8 sm:left-8 sm:max-w-xl sm:p-10">
          {props.eyebrow && <Eyebrow>{props.eyebrow}</Eyebrow>}
          <h1 className="mt-3 text-[clamp(44px,7vw,92px)] leading-[0.95] font-semibold">{props.title}</h1>
          {props.line && <p className={`mt-4 max-w-sm text-[15px] ${MUTED}`}>{props.line}</p>}
        </div>
      </div>
    </section>
  ),
});

export const introCollage = defineSection({
  label: "Intro with photos",
  schema: z.object({ ...heading, text: f.longText.optional(), link: f.button.optional(), images: z.array(f.image).length(3) }),
  fields: [
    ...headingFields,
    { kind: "textarea", key: "text", label: "Text" },
    { kind: "button", key: "link", label: "Link" },
    {
      kind: "list",
      key: "images",
      label: "Photos (exactly three)",
      itemLabel: "Photo",
      newItem: PLACEHOLDER,
      fields: [
        { kind: "imageUrl", key: "src", label: "Photo" },
        { kind: "text", key: "alt", label: "Description for screen readers" },
      ],
    },
  ],
  defaults: { title: "Counsel with", accent: "character.", images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER] },
  component: ({ props, resolveHref }) => (
    <section className="lx-shell grid items-center gap-16 py-20 lg:grid-cols-2">
      <div>
        <SectionHeading eyebrow={props.eyebrow} title={props.title} accent={props.accent} />
        {props.text && <p className={`lx-reveal mt-6 max-w-md text-lg ${MUTED}`}>{props.text}</p>}
        {props.link && (
          <Link href={resolveHref(props.link.href)} className="group mt-8 inline-flex items-center gap-3 border-b border-[var(--site-text)] pb-1 text-sm font-medium transition-colors hover:border-[var(--lx-gold)] hover:text-[var(--site-primary)]">
            {props.link.label} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        )}
      </div>
      <div className="grid min-h-[420px] grid-cols-2 gap-4">
        {props.images.map((image, index) => (
          <div key={`${image.src}-${index}`} className={`lx-reveal relative overflow-hidden rounded-2xl ${index === 0 ? "row-span-2" : "aspect-square"}`}>
            <Photo src={image.src} alt={image.alt} />
          </div>
        ))}
      </div>
    </section>
  ),
});

export const practiceCards = defineSection({
  label: "Photo cards",
  schema: z.object({
    ...heading,
    link: f.button.optional(),
    items: z
      .array(z.object({ title: f.shortText, line: f.shortText.optional(), image: f.image, icon: z.enum(PRACTICE_ICONS), href: f.link.optional() }))
      .min(1)
      .max(10),
  }),
  fields: [
    ...headingFields,
    { kind: "button", key: "link", label: "View all link" },
    {
      kind: "list",
      key: "items",
      label: "Cards",
      itemLabel: "Card",
      newItem: { title: "New area", icon: "briefcase", image: PLACEHOLDER },
      fields: [
        { kind: "text", key: "title", label: "Title" },
        { kind: "text", key: "line", label: "Short line" },
        { kind: "image", key: "image", label: "Photo" },
        {
          kind: "select",
          key: "icon",
          label: "Icon",
          options: [
            { value: "briefcase", label: "Briefcase" },
            { value: "scales", label: "Scales" },
            { value: "family", label: "Family" },
            { value: "home", label: "Home" },
            { value: "doc", label: "Document" },
          ],
        },
        { kind: "link", key: "href", label: "Link" },
      ],
    },
  ],
  defaults: { title: "Practice", accent: "Areas", items: [{ title: "New area", icon: "briefcase", image: PLACEHOLDER }] },
  component: ({ props, resolveHref }) => (
    <section className="lx-shell py-20">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading eyebrow={props.eyebrow} title={props.title} accent={props.accent} />
        {props.link && <TextLink href={resolveHref(props.link.href)}>{props.link.label}</TextLink>}
      </div>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {props.items.map((item) => {
          const card = (
            <>
              <Photo src={item.image.src} alt={item.image.alt} className="transition-transform duration-[1200ms] group-hover:scale-110" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              <span className="absolute inset-x-5 bottom-5 text-white">
                <PracticeIcon name={item.icon} className="size-7 text-[var(--lx-gold-soft)]" />
                <span className="mt-3 block font-[family-name:var(--site-font-heading)] text-2xl leading-tight font-semibold">{item.title}</span>
                {item.line && <span className="mt-2 block text-xs text-white/80">{item.line}</span>}
              </span>
            </>
          );
          const className = "lx-reveal group relative block aspect-[3/4] overflow-hidden rounded-2xl";
          return item.href ? (
            <Link key={item.title} href={resolveHref(item.href)} className={className}>
              {card}
            </Link>
          ) : (
            <div key={item.title} className={className}>
              {card}
            </div>
          );
        })}
      </div>
    </section>
  ),
});

export const quoteBanner = defineSection({
  label: "Photo with quote",
  schema: z.object({ image: f.image, quote: f.longText, accent: f.shortText.optional() }),
  fields: [
    { kind: "image", key: "image", label: "Photo" },
    { kind: "textarea", key: "quote", label: "Quote" },
    { kind: "text", key: "accent", label: "Gold ending" },
  ],
  defaults: { image: PLACEHOLDER, quote: "Excellence is not an act,", accent: "it is our habit." },
  component: ({ props }) => (
    <section className="relative h-[min(85svh,760px)] min-h-[480px] overflow-hidden">
      <Photo src={props.image.src} alt={props.image.alt} />
      <div className="lx-shell relative flex h-full items-end justify-end pb-16">
        <div className="lx-reveal max-w-md rounded-2xl bg-[color-mix(in_srgb,var(--site-background)_95%,transparent)] p-8 backdrop-blur-sm sm:p-10">
          <p className="font-[family-name:var(--site-font-heading)] text-[clamp(30px,3.6vw,46px)] leading-[1.1] italic">
            &ldquo;{props.quote} {props.accent && <span className={GOLD}>{props.accent}</span>}&rdquo;
          </p>
        </div>
      </div>
    </section>
  ),
});

export const team = defineSection({
  label: "Team",
  schema: z.object({ ...heading, link: f.button.optional(), members: z.array(z.object({ name: f.shortText, role: f.shortText.optional(), image: f.image })).min(1).max(24) }),
  fields: [
    ...headingFields,
    { kind: "button", key: "link", label: "View all link" },
    {
      kind: "list",
      key: "members",
      label: "People",
      itemLabel: "Person",
      newItem: { name: "Full name", role: "Role", image: PLACEHOLDER },
      fields: [
        { kind: "text", key: "name", label: "Name" },
        { kind: "text", key: "role", label: "Role" },
        { kind: "image", key: "image", label: "Photo" },
      ],
    },
  ],
  defaults: { title: "Meet the", accent: "Team", members: [{ name: "Full name", role: "Role", image: PLACEHOLDER }] },
  component: ({ props, resolveHref }) => (
    <section className="lx-shell py-20">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading eyebrow={props.eyebrow} title={props.title} accent={props.accent} />
        {props.link && <TextLink href={resolveHref(props.link.href)}>{props.link.label}</TextLink>}
      </div>
      <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
        {props.members.map((member) => (
          <figure key={`${member.name}-${member.image.src}`} className="lx-reveal group">
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl">
              <Photo src={member.image.src} alt={member.image.alt || member.name} className="grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0" />
              <span className="absolute inset-3 rounded-xl border border-white/80 opacity-0 transition-all duration-700 group-hover:inset-4 group-hover:opacity-100" />
            </div>
            <figcaption className="mt-4">
              <span className="block font-[family-name:var(--site-font-heading)] text-2xl font-semibold">{member.name}</span>
              {member.role && <span className="text-[11px] tracking-[0.24em] text-[var(--site-primary)] uppercase">{member.role}</span>}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  ),
});

// Native details elements, so the questions open and close without any script.
export const faq = defineSection({
  label: "Questions and answers",
  schema: z.object({ ...heading, items: z.array(z.object({ question: f.shortText, answer: f.longText })).min(1).max(30) }),
  fields: [
    ...headingFields,
    {
      kind: "list",
      key: "items",
      label: "Questions",
      itemLabel: "Question",
      newItem: { question: "Your question?", answer: "Your answer." },
      fields: [
        { kind: "text", key: "question", label: "Question" },
        { kind: "textarea", key: "answer", label: "Answer" },
      ],
    },
  ],
  defaults: { title: "Common", accent: "questions", items: [{ question: "Your question?", answer: "Your answer." }] },
  component: ({ props }) => (
    <section className="lx-shell py-20">
      <SectionHeading eyebrow={props.eyebrow} title={props.title} accent={props.accent} />
      <div className={`mt-12 border-t ${LINE}`}>
        {props.items.map((item, index) => (
          <details key={item.question} open={index === 0} className={`lx-faq group border-b ${LINE}`}>
            <summary className="flex cursor-pointer items-center justify-between gap-5 py-6 sm:py-7">
              <span className="font-[family-name:var(--site-font-heading)] text-lg leading-snug font-semibold group-hover:text-[var(--site-primary)] sm:text-xl lg:text-2xl">
                {item.question}
              </span>
              <span className={`lx-faq-icon grid size-10 shrink-0 place-items-center rounded-full border ${LINE} text-xl leading-none text-[var(--site-primary)] transition-all duration-300`}>+</span>
            </summary>
            <p className={`max-w-3xl pb-7 text-sm leading-7 whitespace-pre-line sm:text-base ${MUTED}`}>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  ),
});

export const imageStrip = defineSection({
  label: "Moving photo strip",
  schema: z.object({ images: z.array(f.image).min(2).max(20) }),
  fields: [
    {
      kind: "list",
      key: "images",
      label: "Photos",
      itemLabel: "Photo",
      newItem: PLACEHOLDER,
      fields: [
        { kind: "imageUrl", key: "src", label: "Photo" },
        { kind: "text", key: "alt", label: "Description for screen readers" },
      ],
    },
  ],
  defaults: { images: [PLACEHOLDER, PLACEHOLDER] },
  component: ({ props }) => (
    <div className="overflow-hidden py-6">
      <div className="lx-marquee flex w-max gap-4">
        {[...props.images, ...props.images].map((image, index) => (
          <div key={index} aria-hidden={index >= props.images.length} className={`relative h-[300px] shrink-0 overflow-hidden rounded-xl max-sm:h-[200px] ${index % 3 === 1 ? "w-[230px]" : "w-[400px] max-sm:w-[260px]"}`}>
            <Photo src={image.src} alt={index >= props.images.length ? "" : image.alt} />
          </div>
        ))}
      </div>
    </div>
  ),
});

export const lexoraCustomSections = {
  slideshow,
  "page-hero": pageHero,
  "intro-collage": introCollage,
  "photo-cards": practiceCards,
  "quote-banner": quoteBanner,
  team,
  faq,
  "image-strip": imageStrip,
};
