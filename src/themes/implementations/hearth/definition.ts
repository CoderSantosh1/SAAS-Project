import type { ThemeDefinition } from "../../types";

export const hearthDefinition: ThemeDefinition = {
  componentId: "hearth",
  version: "1.0.0",
  name: "Hearth",
  slug: "hearth",
  description: "A warm, inviting design for food and hospitality, with a built-in menu layout.",
  authorName: "WEB",
  primaryCategory: "restaurant",
  categories: ["restaurant", "cafe", "bakery", "hotel"],
  isFeatured: true,
  supportedFeatures: ["multi-page", "responsive", "menu", "gallery", "contact-details"],
  compatibility: { minDocumentVersion: 1 },
  tokens: {
    primary: "#9A3412",
    onPrimary: "#FFFFFF",
    background: "#FFFBF5",
    surface: "#F7EEE1",
    text: "#2B1D14",
    mutedText: "#6B5A4C",
    border: "#E7DAC8",
    headingFont: "playfair",
    bodyFont: "lora",
    radius: "md",
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
            eyebrow: "Open every day",
            heading: "Good food, made by hand, shared together",
            subheading: "Seasonal cooking and a warm welcome in the heart of the neighborhood.",
            primaryButton: { label: "See the menu", href: "/menu" },
            image: { src: "/themes/hearth/1.svg", alt: "Abstract artwork in warm orange tones" },
          },
        },
        {
          type: "features",
          props: {
            heading: "What makes us different",
            items: [
              { title: "Fresh daily", description: "Ingredients from local growers, prepared every morning." },
              { title: "Made from scratch", description: "Breads, sauces and desserts all made in our own kitchen." },
              { title: "Room for everyone", description: "From quiet dinners to big family celebrations." },
            ],
          },
        },
        {
          type: "gallery",
          props: {
            heading: "A look inside",
            images: [
              { src: "/themes/hearth/2.svg", alt: "Abstract artwork in warm tones" },
              { src: "/themes/hearth/3.svg", alt: "Abstract artwork in warm tones" },
              { src: "/themes/hearth/4.svg", alt: "Abstract artwork in warm tones" },
            ],
          },
        },
        {
          type: "testimonials",
          props: {
            items: [
              { quote: "It feels like eating at a friend's home, if your friend were a wonderful cook.", author: "Neha Kapoor" },
            ],
          },
        },
      ],
    },
    {
      title: "Menu",
      slug: "menu",
      sections: [
        {
          type: "services",
          props: {
            heading: "Our menu",
            subheading: "Changes with the seasons. Please tell us about any allergies.",
            items: [
              { name: "Tomato and basil soup", description: "With toasted house bread", price: "₹220" },
              { name: "Garden salad", description: "Leaves, seeds and lemon dressing", price: "₹260" },
              { name: "Roasted vegetable pasta", description: "Fresh pasta with herb butter", price: "₹420" },
              { name: "Grilled paneer", description: "Smoky spices and charred greens", price: "₹450" },
              { name: "Wood-fired flatbread", description: "With two seasonal toppings", price: "₹380" },
              { name: "Warm chocolate cake", description: "With vanilla cream", price: "₹240" },
            ],
          },
        },
      ],
    },
    {
      title: "Our Story",
      slug: "our-story",
      sections: [
        {
          type: "about",
          props: {
            heading: "A kitchen that began at home",
            body: "We started by cooking for friends and neighbors, using recipes passed down through our family.\n\nThe tables are bigger now, but the idea has not changed: cook with care and make everyone feel welcome.",
            image: { src: "/themes/hearth/5.svg", alt: "Abstract artwork in warm orange tones" },
          },
        },
      ],
    },
    {
      title: "Visit",
      slug: "visit",
      sections: [
        {
          type: "contact",
          props: {
            heading: "Come and see us",
            body: "Walk-ins are welcome. Call ahead for groups of six or more.",
            email: "hello@example.com",
            phone: "+91 00000 00000",
            address: "Your street address, City",
            hours: "Every day, 11am to 11pm",
          },
        },
      ],
    },
  ],
};
