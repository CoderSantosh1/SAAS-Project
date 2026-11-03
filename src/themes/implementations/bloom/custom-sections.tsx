import { ArrowRight, ArrowUpRight, Heart, Plus, Quote, Sparkle, Sparkles } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { defineSection, fieldSchemas as f, type SectionField } from "../../types";
import { CountUp } from "../../shared/count-up";
import { DEEP, Icon, ICON_IDS, ICON_OPTIONS, LINE, MUTED, Photo, PillLink, SectionHeading } from "./ui";

// Section types only Bloom offers. Each is a schema, its editor fields, starter content and
// a component. Hover effects are CSS, so every section reads fully without scripts.

const PLACEHOLDER = { src: "/themes/bloom/about-main.jpg", alt: "Fertility consultation" };

const heading = { eyebrow: f.shortText.optional(), title: f.shortText, accent: f.shortText.optional() };
const headingFields: SectionField[] = [
  { kind: "text", key: "eyebrow", label: "Small heading" },
  { kind: "text", key: "title", label: "Heading" },
  { kind: "text", key: "accent", label: "Italic second line" },
];
const imageList = (label: string): SectionField => ({
  kind: "list",
  key: "images",
  label,
  itemLabel: "Photo",
  newItem: PLACEHOLDER,
  fields: [
    { kind: "imageUrl", key: "src", label: "Photo" },
    { kind: "text", key: "alt", label: "Description for screen readers" },
  ],
});

export const archHero = defineSection({
  label: "Arch photo hero",
  providesPageHeading: true,
  schema: z.object({ badge: f.shortText.optional(), title: f.shortText, accent: f.shortText.optional(), text: f.longText.optional(), button: f.button.optional(), mainImage: f.image, smallImage: f.image.optional() }),
  fields: [
    { kind: "text", key: "badge", label: "Badge" },
    { kind: "text", key: "title", label: "Heading" },
    { kind: "text", key: "accent", label: "Italic second line" },
    { kind: "textarea", key: "text", label: "Text" },
    { kind: "button", key: "button", label: "Button" },
    { kind: "image", key: "mainImage", label: "Main photo" },
    { kind: "image", key: "smallImage", label: "Small photo" },
  ],
  defaults: { title: "Your headline", accent: "In italics", mainImage: PLACEHOLDER },
  component: ({ props, resolveHref }) => (
    <section className="relative isolate overflow-hidden bg-[var(--site-background)]">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute -top-24 -left-32 size-80 rounded-full bg-[var(--bl-blush)] opacity-60 blur-3xl" />
        <div className="absolute top-10 -right-32 size-96 rounded-full bg-[var(--bl-petal)] blur-3xl" />
      </div>
      <div className="bl-shell grid items-center gap-10 py-12 lg:min-h-[600px] lg:grid-cols-[0.95fr_1.05fr]">
        <div className="mx-auto w-full max-w-[570px] px-2 py-8 text-center lg:mx-0 lg:text-left">
          {props.badge && (
            <p className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-[var(--site-border)] bg-white/85 px-4 py-2 shadow-sm">
              <Heart size={14} className="shrink-0 fill-[var(--bl-brand)] text-[var(--bl-brand)]" aria-hidden />
              <span className={`text-[10px] font-semibold tracking-[0.19em] uppercase sm:text-[11px] ${DEEP}`}>{props.badge}</span>
            </p>
          )}
          <h1 className="text-[clamp(2.8rem,6.1vw,5.8rem)] leading-[1.02] font-medium tracking-[-0.05em]">
            <span className="block">{props.title}</span>
            {props.accent && <span className="mt-1 block font-normal text-[var(--bl-brand)] italic">{props.accent}</span>}
          </h1>
          {props.text && <p className={`mx-auto mt-6 max-w-md text-lg lg:mx-0 ${MUTED}`}>{props.text}</p>}
          {props.button && (
            <div className="mt-8">
              <PillLink href={resolveHref(props.button.href)}>{props.button.label}</PillLink>
            </div>
          )}
        </div>
        <div className="relative mx-auto w-full max-w-[610px] pt-2 pb-10 lg:ml-auto">
          <div className="absolute inset-x-[12%] top-[7%] h-[78%] rounded-full bg-[var(--bl-blush)] opacity-60 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute top-[2%] right-[5%] hidden h-[85%] w-[78%] rounded-[48%] border border-[var(--bl-brand)] opacity-50 sm:block" aria-hidden />
          <div className="bl-float relative ml-auto h-[330px] w-[88%] overflow-hidden rounded-t-[48%] rounded-b-[43%] border-[6px] border-white bg-[var(--bl-petal)] shadow-[0_20px_60px_rgba(159,100,111,0.17)] sm:h-[440px] sm:border-8 lg:h-[530px] lg:w-[85%]">
            <Photo src={props.mainImage.src} alt={props.mainImage.alt} />
          </div>
          {props.smallImage && (
            <div className="absolute bottom-0 left-0 z-10 h-[155px] w-[48%] overflow-hidden rounded-t-[48%] rounded-b-[24px] border-[6px] border-white bg-[var(--bl-petal)] shadow-[0_16px_40px_rgba(159,100,111,0.2)] sm:left-[2%] sm:h-[205px] sm:w-[45%] sm:border-8 lg:h-[235px]">
              <Photo src={props.smallImage.src} alt={props.smallImage.alt} />
            </div>
          )}
          <span className="absolute right-0 bottom-[24%] z-20 flex size-11 items-center justify-center rounded-full bg-[var(--bl-petal)] text-[var(--bl-brand)]" aria-hidden>
            <Plus size={21} strokeWidth={1.3} />
          </span>
          <span className="absolute top-[9%] right-[1%] z-10 grid grid-cols-4 gap-2" aria-hidden>
            {Array.from({ length: 16 }, (_, index) => (
              <span key={index} className="size-1.5 rounded-full bg-[var(--bl-brand)] opacity-60" />
            ))}
          </span>
          <Sparkles size={19} strokeWidth={1.2} className="absolute right-[13%] bottom-[10%] hidden text-[var(--bl-brand)] sm:block" aria-hidden />
        </div>
      </div>
    </section>
  ),
});

export const pageBanner = defineSection({
  label: "Page banner",
  providesPageHeading: true,
  schema: z.object({ eyebrow: f.shortText.optional(), title: f.shortText, accent: f.shortText.optional(), image: f.image }),
  fields: [
    { kind: "text", key: "eyebrow", label: "Small heading" },
    { kind: "text", key: "title", label: "Page title" },
    { kind: "text", key: "accent", label: "Italic second line" },
    { kind: "image", key: "image", label: "Photo" },
  ],
  defaults: { title: "Page title", accent: "In italics", image: PLACEHOLDER },
  component: ({ props }) => (
    <section className="relative isolate flex h-[62svh] max-h-[680px] min-h-[420px] items-end overflow-hidden bg-[var(--site-text)]">
      <div className="bl-zoom-in absolute inset-0 -z-10">
        <Photo src={props.image.src} alt={props.image.alt} />
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[color-mix(in_srgb,var(--bl-ink-shade)_85%,transparent)] via-[color-mix(in_srgb,var(--bl-ink-shade)_35%,transparent)] to-[color-mix(in_srgb,var(--bl-ink-shade)_10%,transparent)]" />
      <div className="bl-shell pb-12 text-white sm:pb-16 lg:pb-20">
        {props.eyebrow && (
          <p className="mb-4 inline-flex items-center gap-3 text-[11px] font-semibold tracking-[0.3em] text-white/85 uppercase">
            <span className="h-px w-10 bg-white/60" />
            {props.eyebrow}
          </p>
        )}
        <h1 className="text-[clamp(2.6rem,7vw,6rem)] leading-[1] font-medium tracking-[-0.02em] text-white">
          <span className="block">{props.title}</span>
          {props.accent && <span className="block text-[var(--bl-blush)] italic">{props.accent}</span>}
        </h1>
      </div>
    </section>
  ),
});

export const ribbon = defineSection({
  label: "Moving word ribbon",
  schema: z.object({ items: z.array(z.object({ label: f.shortText })).min(2).max(16) }),
  fields: [{ kind: "list", key: "items", label: "Words", itemLabel: "Word", newItem: { label: "New word" }, fields: [{ kind: "text", key: "label", label: "Word" }] }],
  defaults: { items: [{ label: "First" }, { label: "Second" }, { label: "Third" }] },
  component: ({ props }) => (
    <div className="overflow-hidden border-y border-[var(--site-border)] bg-[var(--site-primary)] py-5 text-[var(--site-on-primary)]">
      <div className="bl-marquee flex w-max items-center gap-10 whitespace-nowrap">
        {[...props.items, ...props.items].map((item, index) => (
          <span key={index} aria-hidden={index >= props.items.length} className="flex items-center gap-10 font-[family-name:var(--site-font-heading)] text-2xl italic sm:text-3xl">
            {item.label}
            <Sparkle size={20} className="fill-current opacity-80" aria-hidden />
          </span>
        ))}
      </div>
    </div>
  ),
});

export const aboutMosaic = defineSection({
  label: "About with photo mosaic",
  schema: z.object({
    ...heading,
    link: f.button.optional(),
    badge: f.shortText.optional(),
    mainImage: f.image,
    secondImage: f.image,
    thirdImage: f.image,
    statImage: f.image,
    firstStat: z.object({ value: f.shortText, label: f.shortText }),
    secondStat: z.object({ value: f.shortText, label: f.shortText }),
  }),
  fields: [
    ...headingFields,
    { kind: "button", key: "link", label: "Link" },
    { kind: "text", key: "badge", label: "Badge on the large photo" },
    { kind: "image", key: "mainImage", label: "Large photo" },
    { kind: "image", key: "secondImage", label: "Second photo" },
    { kind: "image", key: "thirdImage", label: "Third photo" },
    { kind: "image", key: "statImage", label: "Photo behind the first number" },
  ],
  defaults: {
    title: "A little more hope.",
    accent: "A lot more care.",
    mainImage: PLACEHOLDER,
    secondImage: PLACEHOLDER,
    thirdImage: PLACEHOLDER,
    statImage: PLACEHOLDER,
    firstStat: { value: "2,500+", label: "Happy Families" },
    secondStat: { value: "15+", label: "Years of Care" },
  },
  component: ({ props, resolveHref }) => (
    <section className="bg-[var(--site-background)] py-20 lg:py-28">
      <div className="bl-shell">
        <div className="mb-12 flex flex-col gap-6 lg:mb-16 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading eyebrow={props.eyebrow} title={props.title} accent={props.accent} left />
          {props.link && (
            <Link href={resolveHref(props.link.href)} className={`group inline-flex items-center gap-2 text-sm font-semibold ${DEEP}`}>
              {props.link.label}
              <span className="flex size-9 items-center justify-center rounded-full border border-[var(--bl-brand)] transition-all duration-300 group-hover:rotate-45 group-hover:bg-[var(--site-primary)] group-hover:text-white">
                <ArrowUpRight size={17} aria-hidden />
              </span>
            </Link>
          )}
        </div>
        <div className="grid auto-rows-[180px] grid-cols-2 gap-3 sm:auto-rows-[220px] sm:gap-4 lg:auto-rows-[260px] lg:grid-cols-4">
          <div className="bl-reveal group relative col-span-2 row-span-2 overflow-hidden rounded-[28px]">
            <Photo src={props.mainImage.src} alt={props.mainImage.alt} className="transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
            {props.badge && (
              <span className={`absolute bottom-5 left-5 inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold tracking-[0.16em] uppercase backdrop-blur ${DEEP}`}>
                <Heart size={14} className="fill-current" aria-hidden />
                {props.badge}
              </span>
            )}
          </div>
          <div className="bl-reveal group relative flex flex-col justify-between overflow-hidden rounded-[28px] p-5 text-white sm:p-7">
            <Photo src={props.statImage.src} alt={props.statImage.alt} className="transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/20" />
            <span className="relative text-[11px] font-semibold tracking-[0.2em] uppercase">{props.firstStat.label}</span>
            <p className="relative font-[family-name:var(--site-font-heading)] text-4xl font-medium sm:text-5xl lg:text-6xl"><CountUp value={props.firstStat.value} /></p>
          </div>
          <div className="bl-reveal group relative overflow-hidden rounded-[28px]">
            <Photo src={props.secondImage.src} alt={props.secondImage.alt} className="transition-transform duration-700 group-hover:scale-105" />
          </div>
          <div className="bl-reveal group relative overflow-hidden rounded-[28px]">
            <Photo src={props.thirdImage.src} alt={props.thirdImage.alt} className="transition-transform duration-700 group-hover:scale-105" />
          </div>
          <div className={`bl-reveal flex flex-col justify-between rounded-[28px] border ${LINE} bg-[var(--bl-petal)] p-5 sm:p-7`}>
            <span className={`text-[11px] font-semibold tracking-[0.2em] uppercase ${DEEP}`}>{props.secondStat.label}</span>
            <p className="font-[family-name:var(--site-font-heading)] text-4xl font-medium sm:text-5xl lg:text-6xl"><CountUp value={props.secondStat.value} /></p>
          </div>
        </div>
      </div>
    </section>
  ),
});

export const treatmentCards = defineSection({
  label: "Expanding photo cards",
  schema: z.object({ ...heading, items: z.array(z.object({ title: f.shortText, description: f.longText.optional(), tag: f.shortText.optional(), image: f.image, href: f.link.optional() })).min(2).max(5) }),
  fields: [
    ...headingFields,
    {
      kind: "list",
      key: "items",
      label: "Cards",
      itemLabel: "Card",
      newItem: { title: "New treatment", image: PLACEHOLDER },
      fields: [
        { kind: "text", key: "title", label: "Title" },
        { kind: "textarea", key: "description", label: "Description" },
        { kind: "text", key: "tag", label: "Tag" },
        { kind: "image", key: "image", label: "Photo" },
        { kind: "link", key: "href", label: "Link" },
      ],
    },
  ],
  defaults: { title: "Personalised paths", accent: "To parenthood", items: [{ title: "First", image: PLACEHOLDER }, { title: "Second", image: PLACEHOLDER }] },
  component: ({ props, resolveHref }) => (
    <section className="bg-white py-20 lg:py-28">
      <div className="bl-shell">
        <div className="mb-12 lg:mb-16">
          <SectionHeading eyebrow={props.eyebrow} title={props.title} accent={props.accent} />
        </div>
        <div className="bl-cards">
          {props.items.map((item, index) => (
            <article key={`${item.title}-${index}`} tabIndex={0} className="bl-card group relative overflow-hidden rounded-[28px] shadow-[0_18px_40px_rgba(120,55,65,0.10)] outline-none">
              <Photo src={item.image.src} alt={item.image.alt} />
              <div className="bl-card-open absolute inset-0 bg-gradient-to-t from-[var(--site-background)] via-[color-mix(in_srgb,var(--site-background)_85%,transparent)] via-40% to-transparent lg:bg-gradient-to-r lg:via-30%" />
              <div className="bl-card-open absolute inset-0 flex flex-col justify-between p-6 lg:p-7">
                <div className="flex items-start justify-between gap-2">
                  {item.tag && (
                    <span className={`inline-flex items-center gap-2 rounded-full border ${LINE} bg-white/85 px-3 py-1.5 text-[10px] font-semibold tracking-[0.12em] uppercase backdrop-blur-md ${DEEP}`}>
                      <span className="flex size-5 items-center justify-center rounded-full bg-[var(--bl-petal)]">{String(index + 1).padStart(2, "0")}</span>
                      {item.tag}
                    </span>
                  )}
                </div>
                <div className="max-w-[340px]">
                  <h3 className="text-4xl leading-[1.02] font-medium tracking-tight sm:text-5xl lg:text-6xl">{item.title}</h3>
                  {item.description && <p className={`mt-3 max-w-[260px] text-sm leading-6 ${MUTED}`}>{item.description}</p>}
                  {item.href && (
                    <Link href={resolveHref(item.href)} className="mt-5 inline-flex items-center gap-3 rounded-full bg-[var(--site-primary)] py-1.5 pr-1.5 pl-5 text-sm font-medium text-[var(--site-on-primary)] shadow-md transition hover:-translate-y-0.5">
                      Explore treatment
                      <span className="flex size-7 items-center justify-center rounded-full bg-white/20"><ArrowRight size={15} aria-hidden /></span>
                    </Link>
                  )}
                </div>
              </div>
              <div className="bl-card-closed absolute inset-0 flex flex-col justify-between bg-[var(--bl-brand)] p-5 text-white" aria-hidden>
                <span className="font-[family-name:var(--site-font-heading)] text-3xl font-semibold">{String(index + 1).padStart(2, "0")}</span>
                <span className="flex items-end justify-between gap-1">
                  <span className="max-w-[160px] font-[family-name:var(--site-font-heading)] text-xl leading-tight">{item.title}</span>
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-[var(--site-primary)]"><ArrowRight size={17} /></span>
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  ),
});

export const photoReasons = defineSection({
  label: "Photo reason cards",
  schema: z.object({ ...heading, items: z.array(z.object({ title: f.shortText, description: f.longText.optional(), image: f.image, icon: z.enum(ICON_IDS) })).min(1).max(6) }),
  fields: [
    ...headingFields,
    {
      kind: "list",
      key: "items",
      label: "Cards",
      itemLabel: "Card",
      newItem: { title: "New reason", icon: "heart", image: PLACEHOLDER },
      fields: [
        { kind: "text", key: "title", label: "Title" },
        { kind: "textarea", key: "description", label: "Description" },
        { kind: "image", key: "image", label: "Photo" },
        { kind: "select", key: "icon", label: "Icon", options: ICON_OPTIONS },
      ],
    },
  ],
  defaults: { title: "Care that puts", accent: "You first.", items: [{ title: "New reason", icon: "heart", image: PLACEHOLDER }] },
  component: ({ props }) => (
    <section className="bg-[var(--site-background)] py-20 lg:py-28">
      <div className="bl-shell">
        <div className="mb-12 lg:mb-16">
          <SectionHeading eyebrow={props.eyebrow} title={props.title} accent={props.accent} />
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {props.items.map((item, index) => (
            <article key={`${item.title}-${index}`} className={`bl-reveal group relative h-[440px] overflow-hidden rounded-[30px] sm:h-[520px] ${index % 3 === 1 ? "lg:mt-16" : ""}`}>
              <Photo src={item.image.src} alt={item.image.alt} className="transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-[color-mix(in_srgb,var(--bl-ink-shade)_88%,transparent)] via-[color-mix(in_srgb,var(--bl-ink-shade)_20%,transparent)] to-transparent" />
              <div className="absolute inset-x-6 bottom-6 text-white">
                <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-white/15 backdrop-blur-md transition-colors duration-500 group-hover:bg-white group-hover:text-[var(--site-primary)]">
                  <Icon name={item.icon} />
                </span>
                <h3 className="text-3xl font-medium">{item.title}</h3>
                {item.description && <p className="mt-2 text-sm leading-6 text-white/85">{item.description}</p>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  ),
});

export const specialists = defineSection({
  label: "Specialist cards",
  schema: z.object({ ...heading, link: f.link.optional(), members: z.array(z.object({ name: f.shortText, role: f.shortText.optional(), experience: f.shortText.optional(), image: f.image })).min(1).max(24) }),
  fields: [
    ...headingFields,
    { kind: "link", key: "link", label: "Booking link on each card" },
    {
      kind: "list",
      key: "members",
      label: "Specialists",
      itemLabel: "Specialist",
      newItem: { name: "Dr. Name", role: "Specialist", image: PLACEHOLDER },
      fields: [
        { kind: "text", key: "name", label: "Name" },
        { kind: "text", key: "role", label: "Role" },
        { kind: "text", key: "experience", label: "Experience" },
        { kind: "image", key: "image", label: "Photo" },
      ],
    },
  ],
  defaults: { title: "Meet our", accent: "Specialists.", members: [{ name: "Dr. Name", role: "Specialist", image: PLACEHOLDER }] },
  component: ({ props, resolveHref }) => (
    <section className="bg-white py-20 lg:py-28">
      <div className="bl-shell">
        <div className="mb-12 md:mb-16">
          <SectionHeading eyebrow={props.eyebrow} title={props.title} accent={props.accent} />
        </div>
        <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {props.members.map((member, index) => (
            <article key={`${member.name}-${index}`} className="bl-reveal group overflow-hidden rounded-[28px] border border-[var(--bl-petal)] bg-white shadow-[0_12px_40px_rgba(99,60,55,0.05)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_24px_60px_rgba(99,60,55,0.12)]">
              <div className="relative h-[360px] overflow-hidden bg-[var(--bl-petal)] sm:h-[400px]">
                <Photo src={member.image.src} alt={member.image.alt || member.name} className="object-top transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/45 to-transparent" />
                {member.experience && (
                  <span className={`absolute bottom-4 left-4 rounded-full border border-white/50 bg-white/90 px-3 py-2 text-xs font-medium backdrop-blur-md ${DEEP}`}>{member.experience}</span>
                )}
                {props.link && (
                  <Link href={resolveHref(props.link)} aria-label={`Book an appointment with ${member.name}`} className="absolute top-4 right-4 flex size-11 items-center justify-center rounded-full bg-white text-[var(--site-primary)] shadow-md transition-all duration-300 hover:rotate-45 hover:bg-[var(--site-primary)] hover:text-white">
                    <ArrowRight size={20} aria-hidden />
                  </Link>
                )}
              </div>
              <div className="p-6 sm:p-7">
                {member.role && <p className={`mb-2 text-xs font-semibold tracking-[0.16em] uppercase ${DEEP}`}>{member.role}</p>}
                <h3 className="text-2xl font-medium tracking-tight">{member.name}</h3>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  ),
});

export const photoStrips = defineSection({
  label: "Moving photo strips",
  schema: z.object({ ...heading, images: z.array(f.image).min(4).max(24) }),
  fields: [...headingFields, imageList("Photos (split between two rows)")],
  defaults: { title: "Little miracles,", accent: "Big happiness.", images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER, PLACEHOLDER] },
  component: ({ props }) => {
    const middle = Math.ceil(props.images.length / 2);
    const rows = [props.images.slice(0, middle), props.images.slice(middle)];
    return (
      <section className="overflow-hidden bg-white py-20 lg:py-28">
        <div className="mb-12 px-4 lg:mb-16">
          <SectionHeading eyebrow={props.eyebrow} title={props.title} accent={props.accent} />
        </div>
        <div className="space-y-4">
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex overflow-hidden">
              <div className={`flex w-max gap-4 pr-4 ${rowIndex === 0 ? "bl-marquee-slow" : "bl-marquee-reverse"}`}>
                {[...row, ...row].map((image, index) => (
                  <div key={index} aria-hidden={index >= row.length} className={`group relative h-[200px] shrink-0 overflow-hidden rounded-[24px] sm:h-[260px] lg:h-[300px] ${index % 2 === 0 ? "w-[300px] sm:w-[400px] lg:w-[460px]" : "w-[170px] sm:w-[220px] lg:w-[250px]"}`}>
                    <Photo src={image.src} alt={index >= row.length ? "" : image.alt} className="transition-transform duration-700 group-hover:scale-110" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  },
});

export const treatmentRows = defineSection({
  label: "Alternating photo rows",
  schema: z.object({ ...heading, items: z.array(z.object({ title: f.shortText, tagline: f.shortText.optional(), summary: f.longText.optional(), image: f.image, href: f.link.optional() })).min(1).max(10) }),
  fields: [
    ...headingFields,
    {
      kind: "list",
      key: "items",
      label: "Rows",
      itemLabel: "Row",
      newItem: { title: "New treatment", image: PLACEHOLDER },
      fields: [
        { kind: "text", key: "title", label: "Title" },
        { kind: "text", key: "tagline", label: "Tagline" },
        { kind: "textarea", key: "summary", label: "Summary" },
        { kind: "image", key: "image", label: "Photo" },
        { kind: "link", key: "href", label: "Link" },
      ],
    },
  ],
  defaults: { title: "Care for every", accent: "Kind of journey.", items: [{ title: "New treatment", image: PLACEHOLDER }] },
  component: ({ props, resolveHref }) => (
    <section className="bg-[var(--site-background)] py-20 lg:py-28">
      <div className="bl-shell">
        <div className="mb-14 lg:mb-20">
          <SectionHeading eyebrow={props.eyebrow} title={props.title} accent={props.accent} />
        </div>
        <div className="space-y-16 lg:space-y-24">
          {props.items.map((item, index) => (
            <div key={`${item.title}-${index}`} className="grid items-center gap-8 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
              <div className={`bl-reveal group relative aspect-[16/11] overflow-hidden rounded-[32px] ${index % 2 ? "lg:order-2" : ""}`}>
                <Photo src={item.image.src} alt={item.image.alt} className="transition-transform duration-1000 group-hover:scale-105" />
              </div>
              <div className="bl-reveal">
                <span className="font-[family-name:var(--site-font-heading)] text-6xl text-[var(--bl-blush)] italic lg:text-7xl">{String(index + 1).padStart(2, "0")}</span>
                {item.tagline && <p className={`mt-2 text-xs font-semibold tracking-[0.24em] uppercase ${DEEP}`}>{item.tagline}</p>}
                <h3 className="mt-3 text-4xl font-medium lg:text-5xl">{item.title}</h3>
                {item.summary && <p className={`mt-4 max-w-md text-base leading-7 ${MUTED}`}>{item.summary}</p>}
                {item.href && (
                  <Link href={resolveHref(item.href)} className={`group/link mt-8 inline-flex items-center gap-3 text-sm font-semibold ${DEEP}`}>
                    Learn more
                    <span className="flex size-11 items-center justify-center rounded-full bg-[var(--site-primary)] text-white transition-transform duration-300 group-hover/link:rotate-45">
                      <ArrowUpRight size={19} aria-hidden />
                    </span>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  ),
});

export const stories = defineSection({
  label: "Photo stories",
  schema: z.object({ ...heading, items: z.array(z.object({ names: f.shortText, place: f.shortText.optional(), tag: f.shortText.optional(), quote: f.longText, image: f.image })).min(1).max(18) }),
  fields: [
    ...headingFields,
    {
      kind: "list",
      key: "items",
      label: "Stories",
      itemLabel: "Story",
      newItem: { names: "Names", quote: "What they said.", image: PLACEHOLDER },
      fields: [
        { kind: "text", key: "names", label: "Names" },
        { kind: "text", key: "place", label: "Place" },
        { kind: "text", key: "tag", label: "Tag" },
        { kind: "textarea", key: "quote", label: "Quote" },
        { kind: "image", key: "image", label: "Photo" },
      ],
    },
  ],
  defaults: { title: "Journeys that", accent: "Ended in joy.", items: [{ names: "Names", quote: "What they said.", image: PLACEHOLDER }] },
  component: ({ props }) => (
    <section className="bg-[var(--site-background)] py-20 lg:py-28">
      <div className="bl-shell">
        <div className="mb-12 lg:mb-16">
          <SectionHeading eyebrow={props.eyebrow} title={props.title} accent={props.accent} />
        </div>
        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
          {props.items.map((story, index) => (
            <figure key={`${story.names}-${index}`} className={`bl-reveal group relative mb-5 break-inside-avoid overflow-hidden rounded-[30px] ${index % 3 === 1 ? "h-[340px]" : "h-[460px]"}`}>
              <Photo src={story.image.src} alt={story.image.alt} className="transition-transform duration-1000 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-[color-mix(in_srgb,var(--bl-ink-shade)_90%,transparent)] via-[color-mix(in_srgb,var(--bl-ink-shade)_25%,transparent)] to-transparent" />
              {story.tag && <span className={`absolute top-5 left-5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold tracking-[0.16em] uppercase backdrop-blur ${DEEP}`}>{story.tag}</span>}
              <figcaption className="absolute inset-x-6 bottom-6 text-white">
                <Quote size={28} className="mb-3 fill-white/20 text-white/70" aria-hidden />
                <blockquote className="font-[family-name:var(--site-font-heading)] text-xl leading-snug sm:text-2xl">{story.quote}</blockquote>
                <p className="mt-4 text-sm font-semibold text-white/85">
                  {story.names}
                  {story.place && <span className="font-normal text-white/65"> · {story.place}</span>}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  ),
});

export const missionVision = defineSection({
  label: "Mission, vision and values",
  schema: z.object({
    title: f.shortText,
    pillars: z.array(z.object({ label: f.shortText, title: f.shortText, text: f.longText, image: f.image, icon: z.enum(ICON_IDS) })).min(1).max(2),
    values: z.array(z.object({ title: f.shortText, text: f.shortText, icon: z.enum(ICON_IDS) })).max(8),
  }),
  fields: [
    { kind: "text", key: "title", label: "Heading" },
    {
      kind: "list",
      key: "pillars",
      label: "Large cards",
      itemLabel: "Card",
      newItem: { label: "Our Mission", title: "Title", text: "Text", image: PLACEHOLDER, icon: "target" },
      fields: [
        { kind: "text", key: "label", label: "Label" },
        { kind: "text", key: "title", label: "Title" },
        { kind: "textarea", key: "text", label: "Text" },
        { kind: "image", key: "image", label: "Photo" },
        { kind: "select", key: "icon", label: "Icon", options: ICON_OPTIONS },
      ],
    },
    {
      kind: "list",
      key: "values",
      label: "Values",
      itemLabel: "Value",
      newItem: { title: "Value", text: "What it means.", icon: "heart" },
      fields: [
        { kind: "text", key: "title", label: "Title" },
        { kind: "text", key: "text", label: "Text" },
        { kind: "select", key: "icon", label: "Icon", options: ICON_OPTIONS },
      ],
    },
  ],
  defaults: { title: "Mission & Vision.", pillars: [{ label: "Our Mission", title: "Title", text: "Text", image: PLACEHOLDER, icon: "target" }], values: [] },
  component: ({ props }) => (
    <section className="bg-[color-mix(in_srgb,var(--bl-petal)_50%,var(--site-background))] py-20 lg:py-28">
      <div className="bl-shell">
        <div className="mb-8">
          <SectionHeading title={props.title} />
        </div>
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          {props.pillars.map((pillar, index) => (
            <div key={`${pillar.title}-${index}`} className="bl-reveal group relative h-[480px] overflow-hidden rounded-[32px] sm:h-[560px]">
              <Photo src={pillar.image.src} alt={pillar.image.alt} className="transition-transform duration-[1400ms] group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-[color-mix(in_srgb,var(--bl-ink-shade)_90%,transparent)] via-[color-mix(in_srgb,var(--bl-ink-shade)_30%,transparent)] to-transparent" />
              <span className="absolute top-4 right-6 font-[family-name:var(--site-font-heading)] text-[clamp(4rem,9vw,7rem)] leading-none font-medium text-white/20 sm:right-8" aria-hidden>
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="absolute inset-x-6 bottom-6 text-white sm:inset-x-10 sm:bottom-10">
                <span className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md transition-colors duration-500 group-hover:bg-[var(--site-primary)]">
                  <Icon name={pillar.icon} size={26} />
                </span>
                <p className="text-[11px] font-semibold tracking-[0.3em] text-[var(--bl-blush)] uppercase">{pillar.label}</p>
                <h3 className="mt-3 text-[clamp(1.9rem,3.6vw,3rem)] leading-[1.05] font-medium">{pillar.title}</h3>
                <p className="mt-4 max-w-md text-sm leading-7 text-white/80 sm:text-base">{pillar.text}</p>
              </div>
            </div>
          ))}
        </div>
        {props.values.length > 0 && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:mt-8 lg:grid-cols-4 lg:gap-6">
            {props.values.map((value, index) => (
              <div key={`${value.title}-${index}`} className={`bl-reveal group flex h-full items-start gap-4 rounded-[24px] border ${LINE} bg-white p-6 transition duration-300 hover:-translate-y-1.5 hover:border-[var(--bl-brand)]`}>
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--bl-petal)] text-[var(--bl-brand)] transition-all duration-500 group-hover:bg-[var(--site-primary)] group-hover:text-white">
                  <Icon name={value.icon} size={21} />
                </span>
                <span>
                  <span className="block font-[family-name:var(--site-font-heading)] text-xl font-medium">{value.title}</span>
                  <span className={`mt-1 block text-sm leading-6 ${MUTED}`}>{value.text}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  ),
});

export const photoBanner = defineSection({
  label: "Full photo banner",
  schema: z.object({ eyebrow: f.shortText.optional(), title: f.shortText, accent: f.shortText.optional(), image: f.image, button: f.button.optional() }),
  fields: [
    { kind: "text", key: "eyebrow", label: "Small heading" },
    { kind: "text", key: "title", label: "Heading" },
    { kind: "text", key: "accent", label: "Italic second line" },
    { kind: "image", key: "image", label: "Photo" },
    { kind: "button", key: "button", label: "Button" },
  ],
  defaults: { title: "Your journey", accent: "Starts here.", image: PLACEHOLDER },
  component: ({ props, resolveHref }) => (
    <section className="relative isolate flex min-h-[560px] items-center overflow-hidden bg-[var(--site-text)] lg:min-h-[720px]">
      <Photo src={props.image.src} alt={props.image.alt} className="-z-10" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[color-mix(in_srgb,var(--site-primary)_95%,transparent)] via-[color-mix(in_srgb,var(--bl-brand)_70%,transparent)] to-[color-mix(in_srgb,var(--bl-brand)_10%,transparent)]" />
      <div className="bl-shell bl-reveal py-24 text-white">
        {props.eyebrow && (
          <p className="mb-6 inline-flex items-center gap-3 text-[11px] font-semibold tracking-[0.3em] text-white/85 uppercase">
            <span className="h-px w-10 bg-white/60" />
            {props.eyebrow}
          </p>
        )}
        <h2 className="max-w-3xl text-[clamp(3rem,8vw,7.5rem)] leading-[1] font-medium tracking-[-0.02em] text-white">
          {props.title}
          {props.accent && <span className="block text-[var(--bl-blush)] italic">{props.accent}</span>}
        </h2>
        {props.button && (
          <div className="mt-10">
            <PillLink href={resolveHref(props.button.href)} light>
              {props.button.label}
            </PillLink>
          </div>
        )}
      </div>
    </section>
  ),
});

export const bloomCustomSections = {
  "arch-hero": archHero,
  "page-banner": pageBanner,
  ribbon,
  "about-mosaic": aboutMosaic,
  "expanding-cards": treatmentCards,
  "reason-cards": photoReasons,
  specialists,
  "photo-strips": photoStrips,
  "photo-rows": treatmentRows,
  stories,
  "mission-vision": missionVision,
  "photo-banner": photoBanner,
};
