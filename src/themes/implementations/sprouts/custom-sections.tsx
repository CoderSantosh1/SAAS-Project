import { Plus, Sparkles } from "lucide-react";
import { z } from "zod";
import { defineSection, fieldSchemas as f, type SectionField } from "../../types";
import { Bubble, COLOR_IDS, COLOR_OPTIONS, COLORS, colorAt, Doodle, Icon, ICON_IDS, ICON_OPTIONS, MUTED, Photo, SectionHeading, Wave } from "./ui";

// Section types only Little Sprouts offers. Each is a schema, its editor fields, starter
// content and a component. Everything reads fully without scripts.

const PLACEHOLDER = { src: "/themes/sprouts/kids-group.jpg", alt: "Happy children at school" };

const heading = { eyebrow: f.shortText.optional(), title: f.shortText, text: f.longText.optional() };
const headingFields: SectionField[] = [
  { kind: "text", key: "eyebrow", label: "Small heading" },
  { kind: "text", key: "title", label: "Heading" },
  { kind: "textarea", key: "text", label: "Text" },
];

export const playHero = defineSection({
  label: "Playful hero",
  providesPageHeading: true,
  schema: z.object({
    title: f.shortText,
    highlight: f.shortText.optional(),
    text: f.longText.optional(),
    primaryButton: f.button.optional(),
    secondaryButton: f.button.optional(),
    badges: z.array(z.object({ label: f.shortText })).max(4),
    image: f.image,
    smallImage: f.image.optional(),
  }),
  fields: [
    { kind: "text", key: "title", label: "Heading" },
    { kind: "text", key: "highlight", label: "Underlined words" },
    { kind: "textarea", key: "text", label: "Text" },
    { kind: "button", key: "primaryButton", label: "Main button" },
    { kind: "button", key: "secondaryButton", label: "Second button" },
    { kind: "list", key: "badges", label: "Badges", itemLabel: "Badge", newItem: { label: "New badge" }, fields: [{ kind: "text", key: "label", label: "Text" }] },
    { kind: "image", key: "image", label: "Main photo" },
    { kind: "image", key: "smallImage", label: "Small photo" },
  ],
  defaults: { title: "A happy place to", highlight: "learn and grow", badges: [], image: PLACEHOLDER },
  component: ({ props, resolveHref }) => (
    <section className="relative overflow-hidden bg-[var(--site-background)] pt-10 pb-6 lg:pt-16">
      <Doodle kind="dots" className="absolute top-10 left-[4%] size-16 opacity-70" />
      <div className="sp-shell grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
        <div className="min-w-0 text-center lg:text-left">
          <h1 className="text-[clamp(2.6rem,6.2vw,5rem)] leading-[1.05] font-black tracking-tight">
            <span>{props.title}</span>
            {props.highlight && (
              <>
                {" "}
                <span className="sp-underline text-[var(--site-primary)]">{props.highlight}</span>
              </>
            )}
          </h1>
          {props.text && <p className={`mx-auto mt-6 max-w-lg text-lg leading-8 lg:mx-0 ${MUTED}`}>{props.text}</p>}
          <div className="mt-8 flex flex-wrap justify-center gap-4 lg:justify-start">
            {props.primaryButton && <Bubble href={resolveHref(props.primaryButton.href)}>{props.primaryButton.label}</Bubble>}
            {props.secondaryButton && (
              <Bubble href={resolveHref(props.secondaryButton.href)} variant="outline">
                {props.secondaryButton.label}
              </Bubble>
            )}
          </div>
          {props.badges.length > 0 && (
            <ul className="mt-9 flex flex-wrap justify-center gap-2 lg:justify-start">
              {props.badges.map((badge, index) => {
                const color = COLORS[colorAt(index)];
                return (
                  <li key={`${badge.label}-${index}`} className="rounded-full px-4 py-2 text-sm font-bold" style={{ background: color.soft }}>
                    {badge.label}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="relative mx-auto w-full max-w-[560px]">
          <div className="sp-blob absolute inset-[6%] -z-0 rotate-6 bg-[var(--sp-sun)]" aria-hidden />
          <div className="sp-blob relative aspect-square overflow-hidden border-4 border-[var(--site-text)]">
            <Photo src={props.image.src} alt={props.image.alt} />
          </div>
          {props.smallImage && (
            <div className="sp-bob absolute -bottom-4 -left-2 size-36 overflow-hidden rounded-full border-4 border-white shadow-xl sm:size-44">
              <Photo src={props.smallImage.src} alt={props.smallImage.alt} />
            </div>
          )}
          <Doodle kind="star" className="sp-bob absolute top-2 right-4 size-12" />
          <Doodle kind="sun" className="sp-spin absolute -top-6 left-6 size-20" />
          <Doodle kind="squiggle" className="absolute right-0 -bottom-2 w-32" />
        </div>
      </div>
    </section>
  ),
});

export const pageHero = defineSection({
  label: "Page title with photo",
  providesPageHeading: true,
  schema: z.object({ eyebrow: f.shortText.optional(), title: f.shortText, text: f.longText.optional(), image: f.image, color: z.enum(COLOR_IDS).optional() }),
  fields: [
    { kind: "text", key: "eyebrow", label: "Small heading" },
    { kind: "text", key: "title", label: "Page title" },
    { kind: "textarea", key: "text", label: "Text" },
    { kind: "image", key: "image", label: "Photo" },
    { kind: "select", key: "color", label: "Color", options: COLOR_OPTIONS },
  ],
  defaults: { title: "Page title", image: PLACEHOLDER },
  component: ({ props }) => {
    const color = COLORS[props.color ?? "sky"];
    return (
      <section className="bg-[var(--site-background)] pt-8">
        <div className="sp-shell">
          <div className="relative grid items-center gap-8 overflow-hidden rounded-[40px] px-6 py-12 sm:px-12 lg:grid-cols-[1.3fr_1fr]" style={{ background: color.soft }}>
            <Doodle kind="dots" className="absolute top-6 right-[42%] hidden size-16 lg:block" />
            <div>
              {props.eyebrow && <p className="mb-3 text-sm font-bold tracking-wide text-[var(--site-primary)] uppercase">{props.eyebrow}</p>}
              <h1 className="text-[clamp(2.4rem,5.5vw,4.2rem)] leading-[1.05] font-black tracking-tight">{props.title}</h1>
              {props.text && <p className={`mt-4 max-w-lg text-lg leading-8 ${MUTED}`}>{props.text}</p>}
            </div>
            <div className="relative mx-auto w-full max-w-xs">
              <div className="sp-blob-2 absolute inset-0 translate-x-3 translate-y-3" style={{ background: color.solid }} aria-hidden />
              <div className="sp-blob-2 relative aspect-square overflow-hidden border-4 border-white">
                <Photo src={props.image.src} alt={props.image.alt} />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  },
});

export const classes = defineSection({
  label: "Class cards by age",
  schema: z.object({ ...heading, items: z.array(z.object({ title: f.shortText, ages: f.shortText.optional(), text: f.longText.optional(), image: f.image, color: z.enum(COLOR_IDS) })).min(1).max(8) }),
  fields: [
    ...headingFields,
    {
      kind: "list",
      key: "items",
      label: "Classes",
      itemLabel: "Class",
      newItem: { title: "New class", ages: "Ages 3–4", image: PLACEHOLDER, color: "mint" },
      fields: [
        { kind: "text", key: "title", label: "Name" },
        { kind: "text", key: "ages", label: "Ages" },
        { kind: "textarea", key: "text", label: "Description" },
        { kind: "image", key: "image", label: "Photo" },
        { kind: "select", key: "color", label: "Color", options: COLOR_OPTIONS },
      ],
    },
  ],
  defaults: { title: "Our classes", items: [{ title: "New class", image: PLACEHOLDER, color: "mint" }] },
  component: ({ props }) => (
    <section className="bg-[var(--site-background)] py-20 lg:py-28">
      <div className="sp-shell">
        <SectionHeading eyebrow={props.eyebrow} title={props.title} text={props.text} />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {props.items.map((item, index) => {
            const color = COLORS[item.color];
            return (
              <article key={`${item.title}-${index}`} className="sp-reveal group flex flex-col items-center rounded-[36px] px-6 pt-8 pb-7 text-center transition hover:-translate-y-2" style={{ background: color.soft }}>
                <div className="relative size-40">
                  <div className="sp-blob absolute inset-0 rotate-12 transition-transform duration-500 group-hover:rotate-45" style={{ background: color.solid }} aria-hidden />
                  <div className="sp-blob absolute inset-2 overflow-hidden border-4 border-white">
                    <Photo src={item.image.src} alt={item.image.alt} />
                  </div>
                </div>
                {item.ages && <span className="mt-5 rounded-full bg-white px-3 py-1 text-xs font-bold">{item.ages}</span>}
                <h3 className="mt-3 text-2xl font-black">{item.title}</h3>
                {item.text && <p className={`mt-2 text-sm leading-6 ${MUTED}`}>{item.text}</p>}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  ),
});

export const aboutBlob = defineSection({
  label: "Photo and points",
  schema: z.object({ ...heading, points: z.array(z.object({ title: f.shortText, text: f.shortText.optional(), icon: z.enum(ICON_IDS) })).max(6), image: f.image, button: f.button.optional() }),
  fields: [
    ...headingFields,
    {
      kind: "list",
      key: "points",
      label: "Points",
      itemLabel: "Point",
      newItem: { title: "New point", icon: "heart" },
      fields: [
        { kind: "text", key: "title", label: "Title" },
        { kind: "text", key: "text", label: "Text" },
        { kind: "select", key: "icon", label: "Icon", options: ICON_OPTIONS },
      ],
    },
    { kind: "image", key: "image", label: "Photo" },
    { kind: "button", key: "button", label: "Button" },
  ],
  defaults: { title: "Why families love us", points: [], image: PLACEHOLDER },
  component: ({ props, resolveHref }) => (
    <section className="overflow-hidden bg-[var(--site-background)] py-20 lg:py-28">
      <div className="sp-shell grid items-center gap-14 lg:grid-cols-2">
        <div className="sp-reveal relative mx-auto w-full max-w-md">
          <div className="sp-blob-2 absolute inset-0 -rotate-6 bg-[var(--sp-mint)]" aria-hidden />
          <div className="sp-blob-2 relative aspect-[4/5] overflow-hidden border-4 border-[var(--site-text)]">
            <Photo src={props.image.src} alt={props.image.alt} />
          </div>
          <Doodle kind="star" className="sp-bob absolute -top-4 -right-2 size-14" />
        </div>
        <div>
          <SectionHeading eyebrow={props.eyebrow} title={props.title} text={props.text} center={false} />
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {props.points.map((point, index) => {
              const color = COLORS[colorAt(index)];
              return (
                <li key={`${point.title}-${index}`} className="sp-reveal flex gap-3 rounded-3xl bg-white p-4 shadow-[0_8px_24px_rgba(36,50,74,0.08)]">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl text-white" style={{ background: color.solid }}>
                    <Icon name={point.icon} size={22} />
                  </span>
                  <span>
                    <span className="block font-bold">{point.title}</span>
                    {point.text && <span className={`block text-sm leading-6 ${MUTED}`}>{point.text}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
          {props.button && (
            <div className="mt-9">
              <Bubble href={resolveHref(props.button.href)} variant="sun">
                {props.button.label}
              </Bubble>
            </div>
          )}
        </div>
      </div>
    </section>
  ),
});

export const dayTimeline = defineSection({
  label: "Daily routine",
  schema: z.object({ ...heading, items: z.array(z.object({ time: f.shortText, title: f.shortText, text: f.shortText.optional(), icon: z.enum(ICON_IDS) })).min(2).max(10) }),
  fields: [
    ...headingFields,
    {
      kind: "list",
      key: "items",
      label: "Moments",
      itemLabel: "Moment",
      newItem: { time: "9:00", title: "New activity", icon: "star" },
      fields: [
        { kind: "text", key: "time", label: "Time" },
        { kind: "text", key: "title", label: "Activity" },
        { kind: "text", key: "text", label: "Description" },
        { kind: "select", key: "icon", label: "Icon", options: ICON_OPTIONS },
      ],
    },
  ],
  defaults: { title: "A day at school", items: [{ time: "8:30", title: "Hello time", icon: "sun" }, { time: "9:00", title: "Circle time", icon: "smile" }] },
  component: ({ props }) => (
    <section className="bg-[var(--site-background)]">
      <Wave fill="color-mix(in srgb, var(--sp-sky) 14%, white)" />
      <div className="bg-[color-mix(in_srgb,var(--sp-sky)_14%,white)] py-16 lg:py-24">
        <div className="sp-shell">
          <SectionHeading eyebrow={props.eyebrow} title={props.title} text={props.text} />
          <ol className="relative mx-auto mt-14 max-w-3xl">
            <span className="absolute top-0 bottom-0 left-[27px] w-1 rounded-full bg-white sm:left-1/2 sm:-translate-x-1/2" aria-hidden />
            {props.items.map((item, index) => {
              const color = COLORS[colorAt(index)];
              const right = index % 2 === 1;
              return (
                <li key={`${item.title}-${index}`} className={`sp-reveal relative mb-6 flex items-center gap-5 sm:w-1/2 ${right ? "sm:ml-auto sm:pl-10" : "sm:flex-row-reverse sm:pr-10 sm:text-right"}`}>
                  <span className={`relative z-10 flex size-14 shrink-0 items-center justify-center rounded-full border-4 border-white text-white sm:absolute ${right ? "sm:-left-7" : "sm:-right-7"}`} style={{ background: color.solid }}>
                    <Icon name={item.icon} size={22} />
                  </span>
                  <div className="flex-1 rounded-3xl bg-white p-5 shadow-[0_8px_24px_rgba(36,50,74,0.08)]">
                    <span className="text-sm font-black" style={{ color: "var(--site-primary)" }}>{item.time}</span>
                    <h3 className="text-lg font-bold">{item.title}</h3>
                    {item.text && <p className={`text-sm leading-6 ${MUTED}`}>{item.text}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
      <Wave fill="color-mix(in srgb, var(--sp-sky) 14%, white)" flip />
    </section>
  ),
});

export const teachers = defineSection({
  label: "Teacher circles",
  schema: z.object({ ...heading, members: z.array(z.object({ name: f.shortText, role: f.shortText.optional(), fact: f.shortText.optional(), image: f.image })).min(1).max(12) }),
  fields: [
    ...headingFields,
    {
      kind: "list",
      key: "members",
      label: "Teachers",
      itemLabel: "Teacher",
      newItem: { name: "Teacher name", role: "Class teacher", image: PLACEHOLDER },
      fields: [
        { kind: "text", key: "name", label: "Name" },
        { kind: "text", key: "role", label: "Role" },
        { kind: "text", key: "fact", label: "Fun fact" },
        { kind: "image", key: "image", label: "Photo" },
      ],
    },
  ],
  defaults: { title: "Meet our teachers", members: [{ name: "Teacher name", image: PLACEHOLDER }] },
  component: ({ props }) => (
    <section className="bg-[var(--site-background)] py-20 lg:py-28">
      <div className="sp-shell">
        <SectionHeading eyebrow={props.eyebrow} title={props.title} text={props.text} />
        <ul className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {props.members.map((member, index) => {
            const color = COLORS[colorAt(index + 2)];
            return (
              <li key={`${member.name}-${index}`} className="sp-reveal group text-center">
                <div className="relative mx-auto size-52">
                  <span className="absolute inset-0 rounded-full border-[6px] border-dashed transition-transform duration-700 group-hover:rotate-90" style={{ borderColor: color.solid }} aria-hidden />
                  <div className="absolute inset-3 overflow-hidden rounded-full">
                    <Photo src={member.image.src} alt={member.image.alt || member.name} className="object-top" />
                  </div>
                </div>
                <h3 className="mt-5 text-xl font-black">{member.name}</h3>
                {member.role && <p className="text-sm font-semibold text-[var(--site-primary)]">{member.role}</p>}
                {member.fact && (
                  <p className="mx-auto mt-3 inline-flex max-w-xs items-start gap-1.5 rounded-2xl px-4 py-2 text-sm" style={{ background: color.soft }}>
                    <Sparkles size={16} className="mt-0.5 shrink-0" aria-hidden />
                    {member.fact}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  ),
});

export const faq = defineSection({
  label: "Parent questions",
  schema: z.object({ ...heading, items: z.array(z.object({ question: f.shortText, answer: f.longText })).min(1).max(16) }),
  fields: [
    ...headingFields,
    {
      kind: "list",
      key: "items",
      label: "Questions",
      itemLabel: "Question",
      newItem: { question: "New question?", answer: "The answer." },
      fields: [
        { kind: "text", key: "question", label: "Question" },
        { kind: "textarea", key: "answer", label: "Answer" },
      ],
    },
  ],
  defaults: { title: "Questions from parents", items: [{ question: "New question?", answer: "The answer." }] },
  component: ({ props }) => (
    <section className="bg-[var(--site-background)] py-20 lg:py-28">
      <div className="sp-shell max-w-3xl">
        <SectionHeading eyebrow={props.eyebrow} title={props.title} text={props.text} />
        <div className="mt-12 grid gap-4">
          {props.items.map((item, index) => {
            const color = COLORS[colorAt(index)];
            return (
              <details key={`${item.question}-${index}`} className="sp-faq sp-reveal rounded-[28px] border-2 border-[var(--site-text)] bg-white px-6 py-5 shadow-[0_5px_0_var(--site-text)]" open={index === 0}>
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-lg font-bold">
                  {item.question}
                  <span className="sp-faq-icon flex size-9 shrink-0 items-center justify-center rounded-full text-white transition-transform" style={{ background: color.solid }}>
                    <Plus size={20} aria-hidden />
                  </span>
                </summary>
                <p className={`mt-3 leading-7 ${MUTED}`}>{item.answer}</p>
              </details>
            );
          })}
        </div>
      </div>
    </section>
  ),
});

export const sproutsCustomSections = {
  "play-hero": playHero,
  "page-hero": pageHero,
  classes,
  "photo-points": aboutBlob,
  "day-timeline": dayTimeline,
  teachers,
  faq,
};
