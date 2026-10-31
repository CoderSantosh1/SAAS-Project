import type { ThemeDefinition } from "../../types";

export const atelierDefinition: ThemeDefinition = {
  componentId: "atelier",
  version: "1.0.0",
  name: "Atelier",
  slug: "atelier",
  description: "A dark, editorial portfolio with large type that lets your work lead.",
  authorName: "WEB",
  primaryCategory: "portfolio",
  categories: [
    "portfolio",
    "developer-portfolio",
    "photography",
    "architecture",
    "interior-design",
    "personal-branding",
  ],
  isFeatured: true,
  supportedFeatures: ["multi-page", "responsive", "gallery", "testimonials"],
  compatibility: { minDocumentVersion: 1 },
  tokens: {
    primary: "#E8FF5A",
    onPrimary: "#111111",
    background: "#111111",
    surface: "#1C1C1C",
    text: "#F5F5F0",
    mutedText: "#A8A8A0",
    border: "#333333",
    headingFont: "space-grotesk",
    bodyFont: "inter",
    radius: "none",
  },
  pages: [
    {
      title: "Work",
      slug: "work",
      isHome: true,
      sections: [
        {
          type: "hero",
          props: {
            eyebrow: "Designer and art director",
            heading: "I make brands people remember",
            subheading: "Independent studio working with founders and cultural organizations on identity, print and digital.",
            primaryButton: { label: "Start a project", href: "/contact" },
            image: { src: "/themes/atelier/1.svg", alt: "Abstract artwork in black and lime" },
          },
        },
        {
          type: "gallery",
          props: {
            heading: "Selected work",
            images: [
              { src: "/themes/atelier/2.svg", alt: "Abstract artwork for a brand identity project", caption: "Northline, brand identity" },
              { src: "/themes/atelier/3.svg", alt: "Abstract artwork for an editorial project", caption: "Field Notes, editorial" },
              { src: "/themes/atelier/4.svg", alt: "Abstract artwork for an exhibition project", caption: "Open Air, exhibition" },
              { src: "/themes/atelier/5.svg", alt: "Abstract artwork for a packaging project", caption: "Salt and Stone, packaging" },
            ],
          },
        },
        {
          type: "testimonials",
          props: {
            heading: "Kind words",
            items: [
              { quote: "The clearest creative process we have ever been part of, and the best result.", author: "Mira Lindqvist", role: "Founder, Northline" },
            ],
          },
        },
      ],
    },
    {
      title: "About",
      slug: "about",
      sections: [
        {
          type: "about",
          props: {
            heading: "Ten years of making things carefully",
            body: "I work with a small number of clients each year, from the first idea through to the finished piece.\n\nEvery project starts with a conversation and ends with something you are proud to put your name on.",
            image: { src: "/themes/atelier/6.svg", alt: "Abstract artwork in black and lime" },
          },
        },
        {
          type: "features",
          props: {
            heading: "How I work",
            items: [
              { title: "Listen", description: "We begin by understanding your audience, your goals and your constraints." },
              { title: "Explore", description: "Several honest directions, discussed openly and refined together." },
              { title: "Deliver", description: "Finished files, clear guidelines and support after launch." },
            ],
          },
        },
      ],
    },
    {
      title: "Contact",
      slug: "contact",
      sections: [
        {
          type: "contact",
          props: {
            heading: "Tell me about your project",
            body: "Currently booking new work for next quarter.",
            email: "hello@example.com",
            address: "Your city, available worldwide",
          },
        },
      ],
    },
  ],
};
