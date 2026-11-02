import type { SectionField, SectionProps, SectionType } from "../types";

const PLACEHOLDER_IMAGE = { src: "/themes/meridian/1.svg", alt: "Placeholder image" };

// Editor fields for the built-in section types. A theme's own sections declare theirs
// next to their schema.
export const SECTION_FIELDS: Record<SectionType, SectionField[]> = {
  hero: [
    { kind: "text", key: "eyebrow", label: "Small heading" },
    { kind: "text", key: "heading", label: "Heading" },
    { kind: "textarea", key: "subheading", label: "Description" },
    { kind: "button", key: "primaryButton", label: "Main button" },
    { kind: "button", key: "secondaryButton", label: "Second button" },
    { kind: "image", key: "image", label: "Image" },
  ],
  features: [
    { kind: "text", key: "heading", label: "Heading" },
    { kind: "textarea", key: "subheading", label: "Description" },
    {
      kind: "list",
      key: "items",
      label: "Features",
      itemLabel: "Feature",
      newItem: { title: "New feature", description: "Describe this feature." },
      fields: [
        { kind: "text", key: "title", label: "Title" },
        { kind: "textarea", key: "description", label: "Description" },
      ],
    },
  ],
  about: [
    { kind: "text", key: "heading", label: "Heading" },
    { kind: "textarea", key: "body", label: "Text" },
    { kind: "image", key: "image", label: "Image" },
  ],
  services: [
    { kind: "text", key: "heading", label: "Heading" },
    { kind: "textarea", key: "subheading", label: "Description" },
    {
      kind: "list",
      key: "items",
      label: "Items",
      itemLabel: "Item",
      newItem: { name: "New item" },
      fields: [
        { kind: "text", key: "name", label: "Name" },
        { kind: "textarea", key: "description", label: "Description" },
        { kind: "text", key: "price", label: "Price" },
      ],
    },
  ],
  gallery: [
    { kind: "text", key: "heading", label: "Heading" },
    {
      kind: "list",
      key: "images",
      label: "Images",
      itemLabel: "Image",
      newItem: PLACEHOLDER_IMAGE,
      fields: [
        { kind: "imageUrl", key: "src", label: "Image" },
        { kind: "text", key: "alt", label: "Description for screen readers" },
        { kind: "text", key: "caption", label: "Caption" },
      ],
    },
  ],
  testimonials: [
    { kind: "text", key: "heading", label: "Heading" },
    {
      kind: "list",
      key: "items",
      label: "Testimonials",
      itemLabel: "Testimonial",
      newItem: { quote: "What your customer said.", author: "Customer name" },
      fields: [
        { kind: "textarea", key: "quote", label: "Quote" },
        { kind: "text", key: "author", label: "Name" },
        { kind: "text", key: "role", label: "Role" },
      ],
    },
  ],
  stats: [
    {
      kind: "list",
      key: "items",
      label: "Statistics",
      itemLabel: "Statistic",
      newItem: { value: "100", label: "Your number" },
      fields: [
        { kind: "text", key: "value", label: "Value" },
        { kind: "text", key: "label", label: "Label" },
      ],
    },
  ],
  cta: [
    { kind: "text", key: "heading", label: "Heading" },
    { kind: "textarea", key: "body", label: "Text" },
    { kind: "button", key: "button", label: "Button" },
  ],
  contact: [
    { kind: "text", key: "heading", label: "Heading" },
    { kind: "textarea", key: "body", label: "Text" },
    { kind: "text", key: "email", label: "Email" },
    { kind: "text", key: "phone", label: "Phone" },
    { kind: "text", key: "address", label: "Address" },
    { kind: "text", key: "hours", label: "Opening hours" },
  ],
};

// A new section starts from generic text rather than a theme's sample business content,
// which would be wrong for a real website.
export const SECTION_DEFAULTS: { [T in SectionType]: SectionProps<T> } = {
  hero: { heading: "Your headline goes here", subheading: "Add a short description of what you do." },
  features: {
    heading: "What we offer",
    items: [
      { title: "First feature", description: "Describe this feature." },
      { title: "Second feature", description: "Describe this feature." },
      { title: "Third feature", description: "Describe this feature." },
    ],
  },
  about: { heading: "About us", body: "Tell your visitors who you are and what you care about." },
  services: {
    heading: "Our services",
    items: [{ name: "First service", description: "Describe this service." }],
  },
  gallery: { heading: "Gallery", images: [PLACEHOLDER_IMAGE] },
  testimonials: {
    heading: "What people say",
    items: [{ quote: "What your customer said.", author: "Customer name" }],
  },
  stats: { items: [{ value: "100", label: "Your number" }] },
  cta: { heading: "Ready to get started?", button: { label: "Contact us", href: "/contact" } },
  contact: { heading: "Get in touch" },
};
