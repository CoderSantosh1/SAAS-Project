import { ArrowRight, Clock, MapPin, Plus } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { defineSection, fieldSchemas as f, type SectionField } from "../../types";
import { ActionLink, Icon, ICON_IDS, ICON_OPTIONS, LINE, MUTED, Photo, SectionHeading } from "./ui";

// Section types only Crestview offers. Each is a schema, its editor fields, starter
// content and a component. Everything reads fully without scripts.

const PLACEHOLDER = { src: "/themes/crestview/campus.jpg", alt: "School campus" };

const heading = { eyebrow: f.shortText.optional(), title: f.shortText, text: f.longText.optional() };
const headingFields: SectionField[] = [
  { kind: "text", key: "eyebrow", label: "Small heading" },
  { kind: "text", key: "title", label: "Heading" },
  { kind: "textarea", key: "text", label: "Text" },
];

export const campusHero = defineSection({
  label: "Campus photo hero",
  providesPageHeading: true,
  schema: z.object({
    eyebrow: f.shortText.optional(),
    title: f.shortText,
    text: f.longText.optional(),
    primaryButton: f.button.optional(),
    secondaryButton: f.button.optional(),
    image: f.image,
    facts: z.array(z.object({ value: f.shortText, label: f.shortText })).max(4),
  }),
  fields: [
    { kind: "text", key: "eyebrow", label: "Small heading" },
    { kind: "text", key: "title", label: "Heading" },
    { kind: "textarea", key: "text", label: "Text" },
    { kind: "button", key: "primaryButton", label: "Main button" },
    { kind: "button", key: "secondaryButton", label: "Second button" },
    { kind: "image", key: "image", label: "Photo" },
    {
      kind: "list",
      key: "facts",
      label: "Quick facts",
      itemLabel: "Fact",
      newItem: { value: "1:14", label: "Teacher ratio" },
      fields: [
        { kind: "text", key: "value", label: "Value" },
        { kind: "text", key: "label", label: "Label" },
      ],
    },
  ],
  defaults: { title: "Where curious minds grow", image: PLACEHOLDER, facts: [] },
  component: ({ props, resolveHref }) => (
    <section className="relative isolate flex min-h-[640px] items-end overflow-hidden bg-[var(--cv-deep)] text-white lg:min-h-[720px]">
      <div className="cv-hero-photo absolute inset-0 -z-10">
        <Photo src={props.image.src} alt={props.image.alt} />
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[color-mix(in_srgb,var(--cv-deep)_92%,transparent)] via-[color-mix(in_srgb,var(--cv-deep)_60%,transparent)] to-transparent" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[color-mix(in_srgb,var(--cv-deep)_70%,transparent)] to-transparent" />
      <div className="cv-shell grid gap-10 pt-28 pb-16 lg:grid-cols-[1.4fr_1fr] lg:items-end lg:pb-24">
        <div className="max-w-2xl">
          {props.eyebrow && <p className="cv-label mb-5 text-xs font-semibold tracking-[0.25em] text-[var(--cv-gold)] uppercase">{props.eyebrow}</p>}
          <h1 className="text-[clamp(2.6rem,6vw,5rem)] leading-[1.04] font-semibold text-white">{props.title}</h1>
          {props.text && <p className="mt-6 max-w-xl text-lg leading-8 text-white/85">{props.text}</p>}
          <div className="mt-9 flex flex-wrap gap-3">
            {props.primaryButton && (
              <ActionLink href={resolveHref(props.primaryButton.href)} variant="light">
                {props.primaryButton.label}
              </ActionLink>
            )}
            {props.secondaryButton && (
              <ActionLink href={resolveHref(props.secondaryButton.href)} variant="outline">
                {props.secondaryButton.label}
              </ActionLink>
            )}
          </div>
        </div>
        {props.facts.length > 0 && (
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--site-radius)] bg-white/20 backdrop-blur-md lg:justify-self-end">
            {props.facts.map((fact, index) => (
              <div key={`${fact.label}-${index}`} className="bg-[color-mix(in_srgb,var(--cv-deep)_55%,transparent)] px-6 py-5">
                <dd className="font-[family-name:var(--site-font-heading)] text-3xl font-semibold text-[var(--cv-gold)]">{fact.value}</dd>
                <dt className="mt-1 text-sm text-white/80">{fact.label}</dt>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  ),
});

export const pageHeader = defineSection({
  label: "Page header",
  providesPageHeading: true,
  schema: z.object({ eyebrow: f.shortText.optional(), title: f.shortText, text: f.longText.optional(), image: f.image }),
  fields: [
    { kind: "text", key: "eyebrow", label: "Small heading" },
    { kind: "text", key: "title", label: "Page title" },
    { kind: "textarea", key: "text", label: "Text" },
    { kind: "image", key: "image", label: "Photo" },
  ],
  defaults: { title: "Page title", image: PLACEHOLDER },
  component: ({ props }) => (
    <section className="relative isolate overflow-hidden bg-[var(--cv-deep)] text-white">
      <Photo src={props.image.src} alt={props.image.alt} className="-z-10 opacity-40" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[var(--cv-deep)] via-[color-mix(in_srgb,var(--cv-deep)_75%,transparent)] to-transparent" />
      <div className="cv-shell py-24 lg:py-32">
        {props.eyebrow && <p className="cv-label mb-5 text-xs font-semibold tracking-[0.25em] text-[var(--cv-gold)] uppercase">{props.eyebrow}</p>}
        <h1 className="max-w-3xl text-[clamp(2.4rem,5.5vw,4.5rem)] leading-[1.05] font-semibold text-white">{props.title}</h1>
        {props.text && <p className="mt-5 max-w-xl text-lg leading-8 text-white/80">{props.text}</p>}
      </div>
    </section>
  ),
});

export const quickLinks = defineSection({
  label: "Quick link cards",
  schema: z.object({ items: z.array(z.object({ title: f.shortText, text: f.shortText.optional(), icon: z.enum(ICON_IDS), href: f.link.optional() })).min(2).max(4) }),
  fields: [
    {
      kind: "list",
      key: "items",
      label: "Cards",
      itemLabel: "Card",
      newItem: { title: "New link", icon: "book" },
      fields: [
        { kind: "text", key: "title", label: "Title" },
        { kind: "text", key: "text", label: "Text" },
        { kind: "select", key: "icon", label: "Icon", options: ICON_OPTIONS },
        { kind: "link", key: "href", label: "Link" },
      ],
    },
  ],
  defaults: { items: [{ title: "Admissions", icon: "graduation-cap" }, { title: "Academics", icon: "book" }] },
  component: ({ props, resolveHref }) => (
    <section className="relative z-10 bg-[var(--site-background)] pb-8">
      <div className="cv-shell">
        <ul className="-mt-12 grid overflow-hidden rounded-[var(--site-radius)] border border-[var(--site-border)] bg-white shadow-[0_24px_60px_rgba(15,35,25,0.12)] sm:grid-cols-2 lg:grid-flow-col lg:auto-cols-fr lg:grid-cols-none">
          {props.items.map((item, index) => {
            const content = (
              <>
                <span className="flex size-12 items-center justify-center rounded-full bg-[var(--cv-tint)] text-[var(--site-primary)] transition group-hover:bg-[var(--site-primary)] group-hover:text-white">
                  <Icon name={item.icon} />
                </span>
                <span className="mt-4 flex items-center gap-2 text-lg font-semibold">
                  {item.title}
                  {item.href && <ArrowRight size={16} className="text-[var(--cv-gold)] transition-transform group-hover:translate-x-1" aria-hidden />}
                </span>
                {item.text && <span className={`mt-1 block text-sm leading-6 ${MUTED}`}>{item.text}</span>}
              </>
            );
            const className = `group block h-full p-7 transition hover:bg-[var(--cv-tint)] ${index > 0 ? "border-t sm:border-t-0 lg:border-l" : ""} ${LINE}`;
            return (
              <li key={`${item.title}-${index}`}>
                {item.href ? <Link href={resolveHref(item.href)} className={className}>{content}</Link> : <div className={className}>{content}</div>}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  ),
});

export const welcome = defineSection({
  label: "Principal's welcome",
  schema: z.object({ ...heading, quote: f.longText.optional(), name: f.shortText, role: f.shortText.optional(), image: f.image, button: f.button.optional() }),
  fields: [
    ...headingFields,
    { kind: "textarea", key: "quote", label: "Highlighted quote" },
    { kind: "text", key: "name", label: "Name" },
    { kind: "text", key: "role", label: "Role" },
    { kind: "image", key: "image", label: "Photo" },
    { kind: "button", key: "button", label: "Button" },
  ],
  defaults: { title: "A warm welcome", name: "Principal's name", image: PLACEHOLDER },
  component: ({ props, resolveHref }) => (
    <section className="bg-[var(--site-background)] py-20 lg:py-28">
      <div className="cv-shell grid items-center gap-14 lg:grid-cols-2">
        <div className="cv-reveal relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="absolute -top-4 -left-4 h-full w-full rounded-[var(--site-radius)] border-2 border-[var(--cv-gold)]" aria-hidden />
          <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--site-radius)]">
            <Photo src={props.image.src} alt={props.image.alt} />
          </div>
          <div className="absolute -right-3 -bottom-6 rounded-[var(--site-radius)] bg-[var(--site-primary)] px-6 py-4 text-[var(--site-on-primary)] shadow-xl sm:-right-6">
            <p className="font-[family-name:var(--site-font-heading)] text-lg font-semibold">{props.name}</p>
            {props.role && <p className="text-sm opacity-80">{props.role}</p>}
          </div>
        </div>
        <div>
          <SectionHeading eyebrow={props.eyebrow} title={props.title} text={props.text} />
          {props.quote && (
            <blockquote className="cv-reveal mt-8 border-l-4 border-[var(--cv-gold)] pl-6 font-[family-name:var(--site-font-heading)] text-xl leading-relaxed italic">{props.quote}</blockquote>
          )}
          {props.button && (
            <div className="mt-9">
              <ActionLink href={resolveHref(props.button.href)}>{props.button.label}</ActionLink>
            </div>
          )}
        </div>
      </div>
    </section>
  ),
});

export const programs = defineSection({
  label: "Program cards",
  schema: z.object({ ...heading, items: z.array(z.object({ title: f.shortText, tag: f.shortText.optional(), text: f.longText.optional(), image: f.image, href: f.link.optional() })).min(1).max(9) }),
  fields: [
    ...headingFields,
    {
      kind: "list",
      key: "items",
      label: "Programs",
      itemLabel: "Program",
      newItem: { title: "New program", image: PLACEHOLDER },
      fields: [
        { kind: "text", key: "title", label: "Title" },
        { kind: "text", key: "tag", label: "Tag" },
        { kind: "textarea", key: "text", label: "Description" },
        { kind: "image", key: "image", label: "Photo" },
        { kind: "link", key: "href", label: "Link" },
      ],
    },
  ],
  defaults: { title: "Our programs", items: [{ title: "New program", image: PLACEHOLDER }] },
  component: ({ props, resolveHref }) => (
    <section className="bg-[var(--cv-tint)] py-20 lg:py-28">
      <div className="cv-shell">
        <SectionHeading eyebrow={props.eyebrow} title={props.title} text={props.text} center />
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {props.items.map((item, index) => (
            <article key={`${item.title}-${index}`} className="cv-reveal group flex flex-col overflow-hidden rounded-[var(--site-radius)] bg-white shadow-[0_10px_30px_rgba(15,35,25,0.06)] transition hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(15,35,25,0.12)]">
              <div className="relative aspect-[16/11] overflow-hidden">
                <Photo src={item.image.src} alt={item.image.alt} className="transition-transform duration-700 group-hover:scale-105" />
                {item.tag && <span className="absolute top-4 left-4 rounded-full bg-[var(--cv-gold)] px-3 py-1 text-xs font-semibold text-[#1b1606]">{item.tag}</span>}
              </div>
              <div className="flex flex-1 flex-col p-7">
                <h3 className="text-2xl font-semibold">{item.title}</h3>
                {item.text && <p className={`mt-3 flex-1 leading-7 ${MUTED}`}>{item.text}</p>}
                {item.href && (
                  <Link href={resolveHref(item.href)} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--site-primary)]">
                    Learn more
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden />
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  ),
});

export const newsEvents = defineSection({
  label: "News and events",
  schema: z.object({
    eyebrow: f.shortText.optional(),
    title: f.shortText,
    news: z.array(z.object({ title: f.shortText, date: f.shortText, image: f.image, href: f.link.optional() })).max(3),
    eventsTitle: f.shortText.optional(),
    events: z.array(z.object({ day: f.shortText, month: f.shortText, title: f.shortText, time: f.shortText.optional(), place: f.shortText.optional() })).max(6),
  }),
  fields: [
    { kind: "text", key: "eyebrow", label: "Small heading" },
    { kind: "text", key: "title", label: "Heading" },
    {
      kind: "list",
      key: "news",
      label: "News stories",
      itemLabel: "Story",
      newItem: { title: "New story", date: "1 Jan 2027", image: PLACEHOLDER },
      fields: [
        { kind: "text", key: "title", label: "Title" },
        { kind: "text", key: "date", label: "Date" },
        { kind: "image", key: "image", label: "Photo" },
        { kind: "link", key: "href", label: "Link" },
      ],
    },
    { kind: "text", key: "eventsTitle", label: "Events heading" },
    {
      kind: "list",
      key: "events",
      label: "Events",
      itemLabel: "Event",
      newItem: { day: "12", month: "Jan", title: "New event" },
      fields: [
        { kind: "text", key: "day", label: "Day" },
        { kind: "text", key: "month", label: "Month" },
        { kind: "text", key: "title", label: "Title" },
        { kind: "text", key: "time", label: "Time" },
        { kind: "text", key: "place", label: "Place" },
      ],
    },
  ],
  defaults: { title: "News and events", news: [], events: [] },
  component: ({ props, resolveHref }) => (
    <section className="bg-[var(--site-background)] py-20 lg:py-28">
      <div className="cv-shell">
        <SectionHeading eyebrow={props.eyebrow} title={props.title} />
        <div className="mt-12 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div className="grid gap-6 sm:grid-cols-2">
            {props.news.map((story, index) => {
              const body = (
                <>
                  <div className="relative aspect-[16/10] overflow-hidden rounded-[var(--site-radius)]">
                    <Photo src={story.image.src} alt={story.image.alt} className="transition-transform duration-700 group-hover:scale-105" />
                  </div>
                  <p className="mt-4 text-xs font-semibold tracking-[0.16em] text-[var(--site-primary)] uppercase">{story.date}</p>
                  <h3 className="mt-2 text-xl leading-snug font-semibold transition group-hover:text-[var(--site-primary)]">{story.title}</h3>
                </>
              );
              return (
                <article key={`${story.title}-${index}`} className={`cv-reveal group ${index === 0 ? "sm:col-span-2" : ""}`}>
                  {story.href ? <Link href={resolveHref(story.href)}>{body}</Link> : body}
                </article>
              );
            })}
          </div>
          {props.events.length > 0 && (
            <div className="cv-reveal rounded-[var(--site-radius)] bg-[var(--cv-tint)] p-7">
              {props.eventsTitle && <h3 className="text-xl font-semibold">{props.eventsTitle}</h3>}
              <ul className="mt-5 divide-y divide-[var(--cv-line)]">
                {props.events.map((event, index) => (
                  <li key={`${event.title}-${index}`} className="flex gap-4 py-4">
                    <span className="flex w-16 shrink-0 flex-col items-center justify-center rounded-[var(--site-radius)] bg-[var(--site-primary)] py-2 text-[var(--site-on-primary)]">
                      <span className="font-[family-name:var(--site-font-heading)] text-2xl leading-none font-semibold">{event.day}</span>
                      <span className="mt-1 text-[11px] font-semibold tracking-wider uppercase">{event.month}</span>
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold">{event.title}</span>
                      {event.time && (
                        <span className={`mt-1 flex items-center gap-1.5 text-sm ${MUTED}`}>
                          <Clock size={14} aria-hidden />
                          {event.time}
                        </span>
                      )}
                      {event.place && (
                        <span className={`mt-0.5 flex items-center gap-1.5 text-sm ${MUTED}`}>
                          <MapPin size={14} aria-hidden />
                          {event.place}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  ),
});

export const steps = defineSection({
  label: "Numbered steps",
  schema: z.object({ ...heading, items: z.array(z.object({ title: f.shortText, text: f.longText.optional() })).min(2).max(6), button: f.button.optional() }),
  fields: [
    ...headingFields,
    {
      kind: "list",
      key: "items",
      label: "Steps",
      itemLabel: "Step",
      newItem: { title: "New step" },
      fields: [
        { kind: "text", key: "title", label: "Title" },
        { kind: "textarea", key: "text", label: "Text" },
      ],
    },
    { kind: "button", key: "button", label: "Button" },
  ],
  defaults: { title: "How to apply", items: [{ title: "Enquire" }, { title: "Visit" }] },
  component: ({ props, resolveHref }) => (
    <section className="bg-[var(--site-background)] py-20 lg:py-28">
      <div className="cv-shell">
        <SectionHeading eyebrow={props.eyebrow} title={props.title} text={props.text} center />
        <ol className="relative mt-16 grid gap-10 md:grid-flow-col md:auto-cols-fr">
          <span className="absolute top-7 right-[8%] left-[8%] hidden h-px bg-[var(--cv-line)] md:block" aria-hidden />
          {props.items.map((step, index) => (
            <li key={`${step.title}-${index}`} className="cv-reveal relative text-center">
              <span className="relative mx-auto flex size-14 items-center justify-center rounded-full border-2 border-[var(--cv-gold)] bg-[var(--site-background)] font-[family-name:var(--site-font-heading)] text-xl font-semibold text-[var(--site-primary)]">
                {index + 1}
              </span>
              <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
              {step.text && <p className={`mx-auto mt-2 max-w-xs text-sm leading-6 ${MUTED}`}>{step.text}</p>}
            </li>
          ))}
        </ol>
        {props.button && (
          <div className="mt-14 text-center">
            <ActionLink href={resolveHref(props.button.href)}>{props.button.label}</ActionLink>
          </div>
        )}
      </div>
    </section>
  ),
});

export const faculty = defineSection({
  label: "Faculty cards",
  schema: z.object({ ...heading, members: z.array(z.object({ name: f.shortText, subject: f.shortText.optional(), image: f.image })).min(1).max(16) }),
  fields: [
    ...headingFields,
    {
      kind: "list",
      key: "members",
      label: "Teachers",
      itemLabel: "Teacher",
      newItem: { name: "Teacher name", subject: "Subject", image: PLACEHOLDER },
      fields: [
        { kind: "text", key: "name", label: "Name" },
        { kind: "text", key: "subject", label: "Subject or role" },
        { kind: "image", key: "image", label: "Photo" },
      ],
    },
  ],
  defaults: { title: "Meet our faculty", members: [{ name: "Teacher name", image: PLACEHOLDER }] },
  component: ({ props }) => (
    <section className="bg-[var(--site-background)] py-20 lg:py-28">
      <div className="cv-shell">
        <SectionHeading eyebrow={props.eyebrow} title={props.title} text={props.text} center />
        <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {props.members.map((member, index) => (
            <li key={`${member.name}-${index}`} className="cv-reveal group">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--site-radius)] bg-[var(--cv-tint)]">
                <Photo src={member.image.src} alt={member.image.alt || member.name} className="object-top grayscale-[30%] transition duration-700 group-hover:scale-105 group-hover:grayscale-0" />
                <span className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-[var(--cv-gold)] transition-transform duration-500 group-hover:scale-x-100" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{member.name}</h3>
              {member.subject && <p className={`text-sm ${MUTED}`}>{member.subject}</p>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  ),
});

export const splitFeature = defineSection({
  label: "Photo with points",
  schema: z.object({ ...heading, points: z.array(z.object({ title: f.shortText, text: f.longText.optional(), icon: z.enum(ICON_IDS) })).max(6), image: f.image, imageRight: z.enum(["yes", "no"]).optional() }),
  fields: [
    ...headingFields,
    {
      kind: "list",
      key: "points",
      label: "Points",
      itemLabel: "Point",
      newItem: { title: "New point", icon: "award" },
      fields: [
        { kind: "text", key: "title", label: "Title" },
        { kind: "textarea", key: "text", label: "Text" },
        { kind: "select", key: "icon", label: "Icon", options: ICON_OPTIONS },
      ],
    },
    { kind: "image", key: "image", label: "Photo" },
    {
      kind: "select",
      key: "imageRight",
      label: "Photo side",
      options: [
        { value: "no", label: "Left" },
        { value: "yes", label: "Right" },
      ],
    },
  ],
  defaults: { title: "Learning beyond the classroom", points: [], image: PLACEHOLDER },
  component: ({ props }) => (
    <section className="bg-[var(--site-background)] py-20 lg:py-28">
      <div className="cv-shell grid items-center gap-14 lg:grid-cols-2">
        <div className={`cv-reveal relative aspect-[5/4] overflow-hidden rounded-[var(--site-radius)] ${props.imageRight === "yes" ? "lg:order-2" : ""}`}>
          <Photo src={props.image.src} alt={props.image.alt} />
        </div>
        <div>
          <SectionHeading eyebrow={props.eyebrow} title={props.title} text={props.text} />
          <ul className="mt-8 grid gap-6">
            {props.points.map((point, index) => (
              <li key={`${point.title}-${index}`} className="cv-reveal flex gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--cv-tint)] text-[var(--site-primary)]">
                  <Icon name={point.icon} size={20} />
                </span>
                <span>
                  <span className="block text-lg font-semibold">{point.title}</span>
                  {point.text && <span className={`mt-1 block leading-7 ${MUTED}`}>{point.text}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  ),
});

export const faq = defineSection({
  label: "Questions and answers",
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
  defaults: { title: "Frequently asked questions", items: [{ question: "New question?", answer: "The answer." }] },
  component: ({ props }) => (
    <section className="bg-[var(--cv-tint)] py-20 lg:py-28">
      <div className="cv-shell grid gap-12 lg:grid-cols-[1fr_1.5fr]">
        <SectionHeading eyebrow={props.eyebrow} title={props.title} text={props.text} />
        <div className="grid gap-3">
          {props.items.map((item, index) => (
            <details key={`${item.question}-${index}`} className="cv-faq cv-reveal rounded-[var(--site-radius)] bg-white px-6 py-5" open={index === 0}>
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-lg font-semibold">
                {item.question}
                <Plus size={20} className="cv-faq-icon shrink-0 text-[var(--site-primary)] transition-transform" aria-hidden />
              </summary>
              <p className={`mt-3 leading-7 ${MUTED}`}>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  ),
});

export const crestviewCustomSections = {
  "campus-hero": campusHero,
  "page-header": pageHeader,
  "quick-links": quickLinks,
  welcome,
  programs,
  "news-events": newsEvents,
  steps,
  faculty,
  "photo-points": splitFeature,
  faq,
};
