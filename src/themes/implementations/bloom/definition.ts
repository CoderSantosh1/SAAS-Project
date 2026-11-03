import type { ThemeDefinition } from "../../types";

const img = (name: string, alt: string) => ({ src: `/themes/bloom/${name}.jpg`, alt });

const doctors = [
  { name: "Dr. Ananya Sharma", role: "Senior Fertility Specialist", experience: "15+ Years Experience", image: img("doctor-1", "Dr. Ananya Sharma") },
  { name: "Dr. Rohan Mehta", role: "IVF & Reproductive Specialist", experience: "12+ Years Experience", image: img("doctor-2", "Dr. Rohan Mehta") },
  { name: "Dr. Priya Verma", role: "Reproductive Medicine Expert", experience: "10+ Years Experience", image: img("doctor-3", "Dr. Priya Verma") },
];

const reasons = {
  eyebrow: "Why Choose Us",
  title: "Care That Puts",
  accent: "You First.",
  items: [
    { title: "Personalised Care", description: "Care that respects your individual journey.", icon: "heart-handshake", image: img("personal-care", "Doctor holding a patient's hands") },
    { title: "Modern Technology", description: "Advanced embryology and treatment options.", icon: "microscope", image: img("lab-technology", "Embryology laboratory") },
    { title: "Expert Guidance", description: "Specialists beside you at every step.", icon: "user-check", image: img("expert-guidance", "Specialist guiding a couple") },
  ],
};

const stats = {
  items: [
    { value: "2,500+", label: "Happy Families" },
    { value: "15+", label: "Years of Care" },
    { value: "12", label: "Specialists" },
    { value: "4", label: "Treatments" },
  ],
};

const gallery = [
  img("parents-baby", "Parents hugging their smiling toddler"),
  img("baby-hand", "Newborn holding a parent's finger"),
  img("sari-maternity", "Expecting mother in a traditional sari"),
  img("mother-baby", "Mother carrying her baby"),
  img("baby-feet", "Parent cradling a newborn's feet"),
  img("smiling-baby", "Mother holding a smiling baby"),
  img("touching-belly", "Couple's hands on a pregnant belly"),
  img("baby-portrait", "Baby with wide curious eyes"),
  img("infant-feet-henna", "Mother holding her infant's feet"),
  img("carrying-baby", "Woman carrying her baby at home"),
];

const journeyBanner = {
  type: "photo-banner",
  props: {
    eyebrow: "Your Story Starts Here",
    title: "Your Journey",
    accent: "Starts Here.",
    image: img("baby-hand-cta", "Newborn's hand resting in a parent's palm"),
    button: { label: "Book Consultation", href: "/contact" },
  },
};

// Bloom, ported from the original IVF Center Next.js site. The sample content below is
// what a new website starts with; owners replace it in the editor.
export const bloomDefinition: ThemeDefinition = {
  componentId: "bloom",
  version: "1.0.0",
  name: "Bloom",
  slug: "bloom",
  description: "A soft blush design for fertility and IVF clinics, with an arched photo hero, expanding treatment cards and family stories.",
  authorName: "Lestow",
  primaryCategory: "ivf-center",
  categories: ["ivf-center", "medical-clinic", "hospital"],
  isFeatured: true,
  supportedFeatures: ["multi-page", "responsive", "testimonials", "gallery", "contact-details"],
  compatibility: { minDocumentVersion: 1 },
  tokens: {
    primary: "#A8546A",
    onPrimary: "#FFFFFF",
    background: "#FFFAF8",
    surface: "#F8E6E8",
    text: "#3A2A2A",
    mutedText: "#6E5E5D",
    border: "#F0D2D7",
    headingFont: "playfair",
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
          type: "arch-hero",
          props: {
            badge: "Compassionate Fertility Care",
            title: "Your Dream of",
            accent: "Parenthood",
            text: "Gentle, expert fertility care that walks beside you from the first consultation to your first hello.",
            button: { label: "Book Consultation", href: "/contact" },
            mainImage: img("ivf-hero", "Fertility specialist caring for an expecting mother"),
            smallImage: img("about-small", "Fertility consultation with a doctor and couple"),
          },
        },
        { type: "ribbon", props: { items: ["IVF", "ICSI", "IUI", "Fertility Assessment", "Egg Freezing", "Embryology Lab", "Genetic Testing", "Emotional Support"].map((label) => ({ label })) } },
        {
          type: "about-mosaic",
          props: {
            eyebrow: "Our Story",
            title: "A Little More Hope.",
            accent: "A Lot More Care.",
            link: { label: "About us", href: "/about" },
            badge: "One-to-one consultations",
            mainImage: img("couple-ultrasound", "Couple holding their baby's first ultrasound photo"),
            statImage: img("family-joy", "Happy family"),
            secondImage: img("doctor-consultation", "Fertility doctor in a consultation with a patient"),
            thirdImage: img("pregnant-belly", "Expecting mother cradling her belly"),
            firstStat: { value: "2,500+", label: "Happy Families" },
            secondStat: { value: "15+", label: "Years of Care" },
          },
        },
        {
          type: "expanding-cards",
          props: {
            eyebrow: "Our Treatments",
            title: "Personalised Paths",
            accent: "To Parenthood.",
            items: [
              { title: "IVF Treatment", description: "Advanced fertility care, personalized for your journey.", tag: "Advanced Care", image: img("ivf", "IVF treatment"), href: "/treatments" },
              { title: "IUI Treatment", description: "A supportive approach to your fertility journey.", tag: "Personalized Care", image: img("iui", "IUI treatment"), href: "/treatments" },
              { title: "Fertility Assessment", description: "Understand your fertility with expert guidance.", tag: "Your First Step", image: img("fertility-assessment", "Fertility assessment"), href: "/treatments" },
            ],
          },
        },
        { type: "reason-cards", props: reasons },
        { type: "specialists", props: { eyebrow: "Meet Our Specialists", title: "Expertise That Makes", accent: "Every Journey Personal.", link: "/contact", members: doctors } },
        { type: "photo-strips", props: { eyebrow: "Moments of Joy", title: "Little Miracles,", accent: "Big Happiness.", images: gallery } },
        journeyBanner,
      ],
    },
    {
      title: "About",
      slug: "about",
      sections: [
        { type: "page-banner", props: { eyebrow: "About Us", title: "Rooted In", accent: "Compassion.", image: img("about-main", "Couple meeting a fertility specialist") } },
        {
          type: "about-mosaic",
          props: {
            eyebrow: "Who We Are",
            title: "Hope, Science",
            accent: "And A Gentle Hand.",
            badge: "Compassion · Science · Transparency",
            mainImage: img("about-smallimage", "Parents forming a heart over a pregnant belly"),
            statImage: img("why-choose-main", "Doctor talking with a couple"),
            secondImage: img("why-choose-small", "Embryologist at work"),
            thirdImage: img("touching-belly", "Couple's hands on a pregnant belly"),
            firstStat: { value: "2,500+", label: "Happy Families" },
            secondStat: { value: "12", label: "Specialists" },
          },
        },
        {
          type: "mission-vision",
          props: {
            title: "Mission & Vision.",
            pillars: [
              { label: "Our Mission", title: "Care That Feels Personal", text: "To give every family honest guidance, advanced treatment and steady support at every step.", icon: "target", image: img("doctor-consultation", "Fertility specialist talking with a couple") },
              { label: "Our Vision", title: "A Family For Everyone", text: "To be the most trusted fertility home, where science and compassion make parenthood possible.", icon: "eye", image: img("family-joy", "Happy family holding their baby") },
            ],
            values: [
              { title: "Compassion", text: "Every patient treated like family.", icon: "hand-heart" },
              { title: "Integrity", text: "Clear advice and honest pricing.", icon: "shield-check" },
              { title: "Innovation", text: "Modern labs and proven methods.", icon: "lightbulb" },
              { title: "Partnership", text: "We decide together, always.", icon: "users" },
            ],
          },
        },
        { type: "stats", props: stats },
        { type: "reason-cards", props: reasons },
        { ...journeyBanner, props: { ...journeyBanner.props, title: "Let's Write", accent: "Yours Together." } },
      ],
    },
    {
      title: "Treatments",
      slug: "treatments",
      sections: [
        { type: "page-banner", props: { eyebrow: "Our Treatments", title: "Paths To", accent: "Parenthood.", image: img("banner", "Embryologist in the laboratory") } },
        {
          type: "photo-rows",
          props: {
            eyebrow: "What We Offer",
            title: "Care For Every",
            accent: "Kind Of Journey.",
            items: [
              { title: "IVF Treatment", tagline: "Advanced Care", summary: "Eggs and sperm are brought together in our lab, and a healthy embryo is placed back in the uterus.", image: img("ivf", "IVF treatment"), href: "/contact" },
              { title: "ICSI Treatment", tagline: "Precision Science", summary: "A single healthy sperm is injected directly into each egg, giving fertilisation the best chance.", image: img("lab-technology", "Embryology laboratory"), href: "/contact" },
              { title: "IUI Treatment", tagline: "Gentle First Step", summary: "Prepared sperm is placed directly in the uterus at the time of ovulation — simple and low-stress.", image: img("iui", "IUI treatment"), href: "/contact" },
              { title: "Fertility Assessment", tagline: "Your First Step", summary: "A complete check-up for both partners so we understand your fertility and plan the right path.", image: img("fertility-assessment-image", "Fertility assessment"), href: "/contact" },
            ],
          },
        },
        { type: "photo-banner", props: { eyebrow: "Advanced Embryology", title: "Science With", accent: "A Gentle Touch.", image: img("pipette-droplet", "Embryologist placing a droplet in a petri dish"), button: { label: "Start Your Journey", href: "/contact" } } },
      ],
    },
    {
      title: "Our Doctors",
      slug: "doctors",
      sections: [
        { type: "page-banner", props: { eyebrow: "Our Doctors", title: "Meet The", accent: "Specialists.", image: img("why-choose-main", "Fertility specialist with a couple") } },
        {
          type: "specialists",
          props: {
            eyebrow: "Our Team",
            title: "Experts Who",
            accent: "Truly Listen.",
            link: "/contact",
            members: [
              ...doctors,
              { name: "Dr. Neha Kapoor", role: "Fertility Consultant", experience: "9+ Years Experience", image: img("doctor-1", "Dr. Neha Kapoor") },
              { name: "Dr. Arjun Malhotra", role: "Reproductive Health Specialist", experience: "11+ Years Experience", image: img("doctor-2", "Dr. Arjun Malhotra") },
              { name: "Dr. Meera Singh", role: "IVF Specialist", experience: "8+ Years Experience", image: img("doctor-3", "Dr. Meera Singh") },
            ],
          },
        },
        journeyBanner,
      ],
    },
    {
      title: "Success Stories",
      slug: "success-stories",
      sections: [
        { type: "page-banner", props: { eyebrow: "Success Stories", title: "Little Miracles,", accent: "Real Joy.", image: img("parents-baby", "Parents with their baby") } },
        { type: "stats", props: stats },
        {
          type: "stories",
          props: {
            eyebrow: "Our Families",
            title: "Journeys That",
            accent: "Ended In Joy.",
            items: [
              { names: "Priya & Rahul", place: "Pune", tag: "IVF", quote: "After years of waiting, the team made us feel hopeful again.", image: img("parents-baby", "Parents with their baby") },
              { names: "Sneha & Arvind", place: "Bengaluru", tag: "ICSI", quote: "Every question was answered with patience and kindness.", image: img("mother-baby", "Mother carrying her baby") },
              { names: "Kavya", place: "Mumbai", tag: "IUI", quote: "Simple, gentle and so caring — exactly what we needed.", image: img("sari-maternity", "Expecting mother in a sari") },
              { names: "Anjali & Vikram", place: "Delhi", tag: "IVF", quote: "They celebrated every small milestone with us.", image: img("smiling-baby", "Mother holding a smiling baby") },
              { names: "Meera & Karan", place: "Jaipur", tag: "Fertility Assessment", quote: "Clear answers in one visit took away so much stress.", image: img("baby-hand", "Newborn holding a parent's finger") },
              { names: "Ritu & Sameer", place: "Hyderabad", tag: "ICSI", quote: "Our little one is here because they never gave up.", image: img("carrying-baby", "Woman carrying her baby") },
            ],
          },
        },
        { type: "photo-strips", props: { eyebrow: "Moments of Joy", title: "Little Miracles,", accent: "Big Happiness.", images: gallery } },
      ],
    },
    {
      title: "Contact",
      slug: "contact",
      sections: [
        { type: "page-banner", props: { eyebrow: "Contact Us", title: "Let's Begin", accent: "Together.", image: img("doctor-consultation", "Fertility consultation") } },
        {
          type: "contact",
          props: {
            heading: "We're Here To Listen.",
            body: "Call, write or visit us. Our care team will help you plan your first consultation.",
            phone: "+1 000 000 0000",
            email: "info@example.com",
            address: "123 Main Street, Apt 5B, USA",
            hours: "Mon – Sat · 9:00 AM – 6:00 PM",
          },
        },
      ],
    },
  ],
};
