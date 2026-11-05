import type { StarterPage, ThemeDefinition } from "../types";
import { deriveTokens } from "./colors";
import type { CollectionProfile } from "./types";

// Turns a collection profile into a theme definition with five sample pages. Images are
// the theme's generated artwork in public/themes/<slug> (see scripts/generate-collection-art.ts).

export const ART_FILES = [
  "hero",
  "scene-1",
  "scene-2",
  "scene-3",
  "scene-4",
  "scene-5",
  "scene-6",
  "place-1",
  "place-2",
  "place-3",
  "place-4",
  "person-1",
  "person-2",
  "person-3",
  "person-4",
] as const;

export type ArtFile = (typeof ART_FILES)[number];

const SPROUT_COLORS = ["sun", "coral", "mint", "grape", "sky"] as const;

function helpers(profile: CollectionProfile) {
  const img = (name: ArtFile, alt: string) => ({ src: `/themes/${profile.slug}/${name}.svg`, alt });
  const [servicesTitle, servicesSlug] = profile.servicesPage;
  const [galleryTitle, gallerySlug] = profile.galleryPage;
  const scene = (index: number) => `scene-${(index % 6) + 1}` as ArtFile;
  const person = (index: number) => `person-${(index % 4) + 1}` as ArtFile;
  const stats = { items: profile.facts.map(([value, label]) => ({ value, label })) };
  const cta = {
    type: "cta",
    props: { heading: profile.intro.title, body: profile.copy.announcement, button: { label: profile.copy.cta, href: "/contact" } },
  };
  const testimonials = {
    type: "testimonials",
    props: {
      heading: "What our clients say",
      items: profile.testimonials.map(([quote, author, role]) => ({ quote, author, role })),
    },
  };
  const gallery = {
    type: "gallery",
    props: {
      heading: `Inside ${profile.name}`,
      images: [
        { ...img("hero", profile.name), caption: profile.hero.eyebrow },
        ...profile.services.items.map(([title], index) => ({ ...img(scene(index), title), caption: title })),
        ...(["place-1", "place-2"] as const).map((name, index) => ({ ...img(name, profile.values.items[index]![0]), caption: profile.values.items[index]![0] })),
      ],
    },
  };
  const contact = {
    type: "contact",
    props: {
      heading: profile.contact.heading,
      body: profile.contact.body,
      phone: profile.contact.phone,
      email: profile.contact.email,
      address: profile.contact.address,
      hours: profile.contact.hours,
    },
  };
  const faq = {
    type: "faq",
    props: {
      eyebrow: "Questions",
      title: "Frequently asked questions",
      items: profile.faqs.map(([question, answer]) => ({ question, answer })),
    },
  };
  return { img, scene, person, stats, cta, testimonials, gallery, contact, faq, servicesTitle, servicesSlug, galleryTitle, gallerySlug };
}

function crestviewPages(profile: CollectionProfile): StarterPage[] {
  const h = helpers(profile);
  const { hero, intro, services, values, team, steps } = profile;
  const programItems = services.items.map(([title, tag, text], index) => ({
    title,
    tag,
    text,
    image: h.img(h.scene(index), title),
    href: `/${h.servicesSlug}`,
  }));

  return [
    {
      title: "Home",
      slug: "home",
      isHome: true,
      sections: [
        {
          type: "campus-hero",
          props: {
            eyebrow: hero.eyebrow,
            title: hero.highlight ? `${hero.title} ${hero.highlight}` : hero.title,
            text: hero.text,
            primaryButton: { label: hero.primary, href: "/contact" },
            secondaryButton: { label: hero.secondary, href: `/${h.servicesSlug}` },
            image: h.img("hero", profile.name),
            facts: profile.facts.map(([value, label]) => ({ value, label })),
          },
        },
        {
          type: "quick-links",
          props: {
            items: [
              { title: h.servicesTitle, text: services.items[0]![0], icon: profile.icons[0], href: `/${h.servicesSlug}` },
              { title: "About us", text: values.items[0]![0], icon: profile.icons[1], href: "/about" },
              { title: h.galleryTitle, text: "See our work", icon: profile.icons[2], href: `/${h.gallerySlug}` },
              { title: "Contact", text: profile.contact.hours, icon: profile.icons[3], href: "/contact" },
            ],
          },
        },
        {
          type: "welcome",
          props: { ...intro, image: h.img("place-1", intro.name), button: { label: "About us", href: "/about" } },
        },
        { type: "stats", props: h.stats },
        {
          type: "programs",
          props: { eyebrow: services.eyebrow, title: services.title, text: services.text, items: programItems.slice(0, 3) },
        },
        h.testimonials,
        h.cta,
      ],
    },
    {
      title: "About",
      slug: "about",
      sections: [
        { type: "page-header", props: { eyebrow: "About us", title: intro.title, text: intro.text.slice(0, 180), image: h.img("place-2", profile.name) } },
        {
          type: "photo-points",
          props: {
            eyebrow: intro.eyebrow,
            title: values.title,
            text: values.text,
            image: h.img("place-3", values.title),
            points: values.items.slice(0, 3).map(([title, text], index) => ({ title, text, icon: profile.icons[index]! })),
          },
        },
        {
          type: "features",
          props: { heading: "What we stand for", subheading: values.text, items: values.items.map(([title, description]) => ({ title, description })) },
        },
        { type: "stats", props: h.stats },
        {
          type: "faculty",
          props: {
            eyebrow: "Our team",
            title: team.title,
            members: team.members.map(([name, subject], index) => ({ name, subject, image: h.img(h.person(index), name) })),
          },
        },
        h.cta,
      ],
    },
    {
      title: h.servicesTitle,
      slug: h.servicesSlug,
      sections: [
        { type: "page-header", props: { eyebrow: services.eyebrow, title: services.title, text: services.text, image: h.img("place-4", services.title) } },
        // On the services page itself, the cards do not link back to it.
        { type: "programs", props: { eyebrow: h.servicesTitle, title: "Find the right fit", items: programItems.map((item) => ({ ...item, href: undefined })) } },
        {
          type: "steps",
          props: {
            eyebrow: "How it works",
            title: steps.title,
            text: steps.text,
            items: steps.items.map(([title, text]) => ({ title, text })),
            button: { label: profile.copy.cta, href: "/contact" },
          },
        },
        h.faq,
        h.cta,
      ],
    },
    {
      title: h.galleryTitle,
      slug: h.gallerySlug,
      sections: [
        { type: "page-header", props: { eyebrow: h.galleryTitle, title: `A closer look at ${profile.name}`, image: h.img("scene-1", profile.name) } },
        h.gallery,
        h.testimonials,
      ],
    },
    {
      title: "Contact",
      slug: "contact",
      sections: [
        { type: "page-header", props: { eyebrow: "Contact", title: profile.contact.heading, image: h.img("place-1", "Contact us") } },
        h.contact,
      ],
    },
  ];
}

function sproutsPages(profile: CollectionProfile): StarterPage[] {
  const h = helpers(profile);
  const { hero, intro, services, values, team, steps } = profile;
  const color = (index: number) => SPROUT_COLORS[index % SPROUT_COLORS.length]!;
  const classes = services.items.map(([title, ages, text], index) => ({
    title,
    ages,
    text,
    image: h.img(h.scene(index), title),
    color: color(index),
  }));
  const timeline = {
    type: "day-timeline",
    props: {
      eyebrow: "How it works",
      title: steps.title,
      text: steps.text,
      items: steps.items.map(([title, text], index) => ({ time: `Step ${index + 1}`, title, text, icon: profile.icons[index]! })),
    },
  };

  return [
    {
      title: "Home",
      slug: "home",
      isHome: true,
      sections: [
        {
          type: "play-hero",
          props: {
            title: hero.title,
            highlight: hero.highlight,
            text: hero.text,
            primaryButton: { label: hero.primary, href: "/contact" },
            secondaryButton: { label: hero.secondary, href: `/${h.servicesSlug}` },
            badges: profile.facts.map(([value, label]) => ({ label: `${value} ${label.toLowerCase()}` })),
            image: h.img("hero", profile.name),
            smallImage: h.img("scene-2", services.items[1]![0]),
          },
        },
        { type: "stats", props: h.stats },
        { type: "classes", props: { eyebrow: services.eyebrow, title: services.title, text: services.text, items: classes.slice(0, 3) } },
        {
          type: "photo-points",
          props: {
            eyebrow: intro.eyebrow,
            title: intro.title,
            text: intro.text,
            image: h.img("place-1", intro.title),
            points: values.items.slice(0, 4).map(([title, text], index) => ({ title, text: text.slice(0, 200), icon: profile.icons[index]! })),
            button: { label: "About us", href: "/about" },
          },
        },
        timeline,
        {
          type: "teachers",
          props: {
            eyebrow: "Our team",
            title: team.title,
            members: team.members.map(([name, role], index) => ({ name, role, image: h.img(h.person(index), name) })),
          },
        },
        h.testimonials,
        h.cta,
      ],
    },
    {
      title: "About",
      slug: "about",
      sections: [
        { type: "page-hero", props: { eyebrow: "About us", title: intro.title, text: intro.quote.slice(0, 180), image: h.img("place-2", profile.name), color: "mint" } },
        {
          type: "features",
          props: { heading: values.title, subheading: values.text, items: values.items.map(([title, description]) => ({ title, description })) },
        },
        { type: "stats", props: h.stats },
        {
          type: "photo-points",
          props: {
            eyebrow: "Meet the founder",
            title: intro.name,
            text: intro.quote,
            image: h.img("person-1", intro.name),
            points: values.items.slice(3, 6).map(([title, text], index) => ({ title, text: text.slice(0, 200), icon: profile.icons[(index + 1) % 4]! })),
          },
        },
      ],
    },
    {
      title: h.servicesTitle,
      slug: h.servicesSlug,
      sections: [
        { type: "page-hero", props: { eyebrow: services.eyebrow, title: services.title, text: services.text, image: h.img("place-3", services.title), color: "sun" } },
        { type: "classes", props: { eyebrow: h.servicesTitle, title: "Find the right fit", items: classes } },
        timeline,
        h.faq,
        h.cta,
      ],
    },
    {
      title: h.galleryTitle,
      slug: h.gallerySlug,
      sections: [
        { type: "page-hero", props: { eyebrow: h.galleryTitle, title: `A closer look at ${profile.name}`, image: h.img("place-4", profile.name), color: "coral" } },
        h.gallery,
      ],
    },
    {
      title: "Contact",
      slug: "contact",
      sections: [
        { type: "page-hero", props: { eyebrow: "Contact", title: profile.contact.heading, image: h.img("scene-3", "Contact us"), color: "sky" } },
        h.contact,
      ],
    },
  ];
}

export function buildDefinition(profile: CollectionProfile): ThemeDefinition {
  return {
    componentId: profile.slug,
    version: "1.0.0",
    name: profile.name,
    slug: profile.slug,
    description: profile.description,
    authorName: "Lestow",
    primaryCategory: profile.category,
    categories: [profile.category, ...(profile.categories ?? [])],
    isFeatured: profile.featured ?? false,
    supportedFeatures: ["multi-page", "responsive", "testimonials", "gallery", "contact-details"],
    compatibility: { minDocumentVersion: 1 },
    tokens: deriveTokens({
      primary: profile.primary,
      headingFont: profile.headingFont,
      bodyFont: profile.bodyFont,
      radius: profile.radius ?? (profile.base === "sprouts" ? "lg" : "md"),
    }),
    pages: profile.base === "crestview" ? crestviewPages(profile) : sproutsPages(profile),
  };
}
