import type { ThemeDefinition } from "../../types";

export const meridianDefinition: ThemeDefinition = {
  componentId: "meridian",
  version: "1.0.0",
  name: "Meridian",
  slug: "meridian",
  description: "A clean, confident layout for companies and professional services.",
  authorName: "WEB",
  primaryCategory: "business",
  categories: [
    "business",
    "corporate",
    "consulting",
    "digital-agency",
    "it-company",
    "financial-services",
    "law-firm",
    "insurance",
  ],
  isFeatured: true,
  supportedFeatures: ["multi-page", "responsive", "contact-details", "testimonials"],
  compatibility: { minDocumentVersion: 1 },
  tokens: {
    primary: "#1D4ED8",
    onPrimary: "#FFFFFF",
    background: "#FFFFFF",
    surface: "#F1F5F9",
    text: "#0F172A",
    mutedText: "#475569",
    border: "#E2E8F0",
    headingFont: "sora",
    bodyFont: "inter",
    radius: "lg",
  },
  pages: [
    {
      title: "Home",
      slug: "home",
      isHome: true,
      sections: [
        {
          type: "hero",
          props: {
            eyebrow: "Strategy and operations",
            heading: "Grow your business with a partner you can trust",
            subheading: "We help growing companies plan clearly, run smoothly and serve their customers better.",
            primaryButton: { label: "Talk to us", href: "/contact" },
            secondaryButton: { label: "Our services", href: "/services" },
            image: { src: "/themes/meridian/1.svg", alt: "Abstract blue geometric artwork" },
          },
        },
        {
          type: "stats",
          props: {
            items: [
              { value: "12+", label: "Years of experience" },
              { value: "300+", label: "Projects delivered" },
              { value: "40", label: "Team members" },
              { value: "98%", label: "Clients who return" },
            ],
          },
        },
        {
          type: "features",
          props: {
            heading: "Why teams choose us",
            subheading: "Practical help, clear communication and results you can measure.",
            items: [
              { title: "Clear plans", description: "A simple roadmap everyone in your company can understand and follow." },
              { title: "Hands-on delivery", description: "We work alongside your team until the job is done properly." },
              { title: "Honest reporting", description: "Regular updates on what is working and what needs to change." },
            ],
          },
        },
        {
          type: "testimonials",
          props: {
            heading: "What clients say",
            items: [
              { quote: "They brought order to a very busy year, and our team still uses their process.", author: "Priya Sharma", role: "Operations Director" },
              { quote: "Straightforward advice with no jargon. Exactly what we needed.", author: "Daniel Reyes", role: "Founder" },
              { quote: "Our customer response time was cut in half within three months.", author: "Aisha Khan", role: "Head of Service" },
            ],
          },
        },
        {
          type: "cta",
          props: {
            heading: "Ready to get started?",
            body: "Tell us where you want your business to go next.",
            button: { label: "Contact us", href: "/contact" },
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
            heading: "A team that cares about your outcome",
            body: "We started with a simple belief: good advice should be easy to understand and easy to act on.\n\nToday we support companies across many industries, with the same focus on clarity and steady progress.",
            image: { src: "/themes/meridian/2.svg", alt: "Abstract blue geometric artwork" },
          },
        },
      ],
    },
    {
      title: "Services",
      slug: "services",
      sections: [
        {
          type: "services",
          props: {
            heading: "How we can help",
            subheading: "Choose a focused engagement or combine them into a complete program.",
            items: [
              { name: "Business strategy", description: "Set direction, priorities and measurable goals." },
              { name: "Process improvement", description: "Remove delays and make daily work simpler." },
              { name: "Customer experience", description: "Understand your customers and serve them better." },
              { name: "Team training", description: "Give your people the skills to keep improving." },
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
            heading: "Get in touch",
            body: "We reply to every message within one working day.",
            email: "hello@example.com",
            phone: "+91 00000 00000",
            address: "Your office address, City",
            hours: "Monday to Friday, 9am to 6pm",
          },
        },
      ],
    },
  ],
};
