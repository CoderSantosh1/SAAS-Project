import type { ThemeDefinition } from "../../types";

const img = (name: string, alt: string) => ({ src: `/themes/sprouts/${name}.jpg`, alt });

const stats = {
  items: [
    { value: "15+", label: "Years of happy learning" },
    { value: "450", label: "Little learners" },
    { value: "1:8", label: "Teacher to child ratio" },
    { value: "100%", label: "Trained teachers" },
  ],
};

const enrollCta = {
  type: "cta",
  props: {
    heading: "Come and play with us!",
    body: "Book a visit to see our classrooms, meet the teachers and join a fun trial class.",
    button: { label: "Book a school visit", href: "/contact" },
  },
};

// Little Sprouts: a bright, playful design for preschools and primary schools. The sample
// content below is what a new website starts with.
export const sproutsDefinition: ThemeDefinition = {
  componentId: "sprouts",
  version: "1.0.0",
  name: "Little Sprouts",
  slug: "sprouts",
  description: "A bright, playful design for preschools and primary schools, with blob photos, age-group classes, a daily routine and a photo wall.",
  authorName: "Lestow",
  primaryCategory: "school",
  categories: ["school", "coaching-institute", "online-education"],
  isFeatured: true,
  supportedFeatures: ["multi-page", "responsive", "testimonials", "gallery", "contact-details"],
  compatibility: { minDocumentVersion: 1 },
  tokens: {
    primary: "#1D6FD8",
    onPrimary: "#FFFFFF",
    background: "#FFFDF7",
    surface: "#FFF4DC",
    text: "#24324A",
    mutedText: "#56627A",
    border: "#F0E3C6",
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
          type: "play-hero",
          props: {
            title: "A happy place to",
            highlight: "play, learn and grow",
            text: "Little Sprouts is a caring preschool and primary school where every child feels safe, loved and excited to learn.",
            primaryButton: { label: "Enroll your child", href: "/contact" },
            secondaryButton: { label: "Our classes", href: "/classes" },
            badges: [{ label: "Ages 2 to 10" }, { label: "Safe campus" }, { label: "Healthy meals" }, { label: "Small classes" }],
            image: img("kids-group", "Smiling school children waving"),
            smallImage: img("drawing", "A child drawing at the table"),
          },
        },
        { type: "stats", props: stats },
        {
          type: "classes",
          props: {
            eyebrow: "Our classes",
            title: "A class for every little learner",
            text: "Play-based learning that grows with your child.",
            items: [
              { title: "Toddlers", ages: "Ages 2–3", text: "Gentle first steps with songs, stories and sensory play.", image: img("stacking", "Toddler stacking blocks"), color: "coral" },
              { title: "Nursery", ages: "Ages 3–4", text: "Shapes, colors and friendships through playful projects.", image: img("letter-cubes", "Children playing with letter cubes"), color: "sun" },
              { title: "Kindergarten", ages: "Ages 4–6", text: "Early reading, numbers and lots of curious questions.", image: img("coloring", "Child coloring with a teacher"), color: "mint" },
              { title: "Primary", ages: "Ages 6–10", text: "Strong foundations in reading, maths, science and art.", image: img("reading", "Boy reading a book"), color: "grape" },
            ],
          },
        },
        {
          type: "photo-points",
          props: {
            eyebrow: "Why Little Sprouts",
            title: "Where every child shines",
            text: "We believe children learn best when they feel safe, happy and free to explore.",
            image: img("circle-time", "Children at circle time on the carpet"),
            points: [
              { title: "Learning through play", text: "Hands-on activities every day.", icon: "puzzle" },
              { title: "Caring teachers", text: "Trained, kind and patient.", icon: "heart" },
              { title: "Safe and secure", text: "CCTV, trained staff and safe pickup.", icon: "shield" },
              { title: "Healthy meals", text: "Fresh, balanced snacks and lunch.", icon: "apple" },
            ],
            button: { label: "About our school", href: "/about" },
          },
        },
        {
          type: "day-timeline",
          props: {
            eyebrow: "A day with us",
            title: "Fun from morning to home time",
            items: [
              { time: "8:30 AM", title: "Hello and free play", text: "Warm welcomes and play to settle in.", icon: "sun" },
              { time: "9:15 AM", title: "Circle time", text: "Songs, stories and today's big question.", icon: "smile" },
              { time: "10:00 AM", title: "Learning corners", text: "Letters, numbers, science and building.", icon: "book" },
              { time: "11:00 AM", title: "Outdoor adventures", text: "Garden play, sand pit and games.", icon: "trees" },
              { time: "12:00 PM", title: "Lunch together", text: "Healthy food and good manners.", icon: "apple" },
              { time: "1:00 PM", title: "Art and music", text: "Painting, crafts, dance and rhythm.", icon: "palette" },
            ],
          },
        },
        {
          type: "teachers",
          props: {
            eyebrow: "Our team",
            title: "Teachers who love what they do",
            members: [
              { name: "Ms. Meera Joshi", role: "Nursery teacher", fact: "Knows 200 nursery rhymes by heart", image: img("teacher-1", "Meera Joshi") },
              { name: "Ms. Anna Lee", role: "Kindergarten teacher", fact: "Brings her guitar to every class", image: img("teacher-2", "Anna Lee") },
              { name: "Ms. Fatima Khan", role: "Primary coordinator", fact: "Runs our little science club", image: img("teacher-3", "Fatima Khan") },
            ],
          },
        },
        {
          type: "testimonials",
          props: {
            heading: "Parents love Little Sprouts",
            items: [
              { quote: "My son runs into school every morning. The teachers are so warm and caring.", author: "Neha Sharma", role: "Mom of Aarav, Nursery" },
              { quote: "We have seen our daughter's confidence grow so much in just one year.", author: "David Wilson", role: "Dad of Lily, Kindergarten" },
              { quote: "Safe, clean and full of joy. The daily updates make us feel part of it.", author: "Priya Menon", role: "Mom of Kabir, Toddlers" },
            ],
          },
        },
        enrollCta,
      ],
    },
    {
      title: "About",
      slug: "about",
      sections: [
        { type: "page-hero", props: { eyebrow: "About us", title: "Growing happy, curious kids since 2010", text: "Our story, our values and our cosy little campus.", image: img("teacher-class", "Teacher with a class of children"), color: "mint" } },
        {
          type: "features",
          props: {
            heading: "What we believe",
            subheading: "Six simple ideas guide everything we do.",
            items: [
              { title: "Every child is unique", description: "We follow each child's pace and interests." },
              { title: "Play is learning", description: "Children learn most when they are having fun." },
              { title: "Kindness first", description: "We teach sharing, caring and good friendships." },
              { title: "Curious minds", description: "Questions are welcome, every single one." },
              { title: "Healthy bodies", description: "Fresh food, outdoor play and plenty of rest." },
              { title: "Families as partners", description: "Daily updates and an open door for parents." },
            ],
          },
        },
        { type: "stats", props: stats },
        {
          type: "photo-points",
          props: {
            eyebrow: "Our campus",
            title: "Bright rooms and green gardens",
            image: img("nursery-room", "A bright nursery classroom"),
            points: [
              { title: "Sunny classrooms", text: "Bright, clean and full of books.", icon: "sun" },
              { title: "Garden play area", text: "Soft flooring and safe equipment.", icon: "trees" },
              { title: "Art studio", text: "Paints, clay and messy fun.", icon: "brush" },
              { title: "School bus", text: "Safe rides with a trained helper.", icon: "bus" },
            ],
          },
        },
        enrollCta,
      ],
    },
    {
      title: "Classes",
      slug: "classes",
      sections: [
        { type: "page-hero", props: { eyebrow: "Classes", title: "Learning that grows with your child", text: "From first steps to confident readers.", image: img("classroom", "Children at their desks"), color: "sun" } },
        {
          type: "classes",
          props: {
            title: "Find the right class",
            items: [
              { title: "Toddlers", ages: "Ages 2–3", text: "Half days of gentle play, music and sensory fun.", image: img("stacking", "Toddler stacking blocks"), color: "coral" },
              { title: "Nursery", ages: "Ages 3–4", text: "Shapes, colors, rhymes and making friends.", image: img("letter-cubes", "Letter cubes"), color: "sun" },
              { title: "Kindergarten", ages: "Ages 4–6", text: "Phonics, early maths and first science projects.", image: img("coloring", "Coloring"), color: "mint" },
              { title: "Primary", ages: "Ages 6–10", text: "Reading, writing, maths, science, art and sport.", image: img("reading", "Reading"), color: "grape" },
            ],
          },
        },
        {
          type: "day-timeline",
          props: {
            eyebrow: "Our routine",
            title: "What a school day looks like",
            items: [
              { time: "8:30 AM", title: "Arrival", text: "Hugs, hellos and free play.", icon: "sun" },
              { time: "9:15 AM", title: "Circle time", icon: "smile" },
              { time: "10:00 AM", title: "Learning corners", icon: "book" },
              { time: "11:00 AM", title: "Outdoor play", icon: "trees" },
              { time: "12:00 PM", title: "Lunch", icon: "apple" },
              { time: "1:00 PM", title: "Art, music and home time", icon: "music" },
            ],
          },
        },
        enrollCta,
      ],
    },
    {
      title: "Gallery",
      slug: "gallery",
      sections: [
        { type: "page-hero", props: { eyebrow: "Gallery", title: "Smiles, giggles and big discoveries", image: img("outdoor-play", "Children playing outdoors"), color: "coral" } },
        {
          type: "gallery",
          props: {
            heading: "Our photo wall",
            images: [
              { ...img("kids-group", "Children waving"), caption: "Best friends" },
              { ...img("drawing", "Drawing"), caption: "Little artists" },
              { ...img("toys", "Toys"), caption: "Play time" },
              { ...img("circle-time", "Circle time"), caption: "Circle time" },
              { ...img("outdoor-play", "Outdoor play"), caption: "In the garden" },
              { ...img("pretend-play", "Pretend play"), caption: "Pretend play" },
              { ...img("blocks", "Blocks"), caption: "Builders" },
              { ...img("friends", "Friends"), caption: "Adventures" },
            ],
          },
        },
      ],
    },
    {
      title: "Admissions",
      slug: "admissions",
      sections: [
        { type: "page-hero", props: { eyebrow: "Admissions", title: "Join our little family", text: "Admissions are open for the new school year.", image: img("friends", "Children together outdoors"), color: "grape" } },
        {
          type: "faq",
          props: {
            eyebrow: "Parent questions",
            title: "Everything you need to know",
            items: [
              { question: "What ages do you accept?", answer: "We welcome children from 2 to 10 years old, from Toddlers through to Primary." },
              { question: "What are the school hours?", answer: "School runs from 8:30 AM to 2:00 PM. After-school care is available until 5:30 PM." },
              { question: "Do you provide meals?", answer: "Yes. Our kitchen prepares fresh, healthy snacks and lunch every day, with options for allergies." },
              { question: "How do I apply?", answer: "Book a visit, meet our teachers and fill in a short form. We will confirm your child's place within a week." },
            ],
          },
        },
        enrollCta,
      ],
    },
    {
      title: "Contact",
      slug: "contact",
      sections: [
        { type: "page-hero", props: { eyebrow: "Contact", title: "We would love to meet you", image: img("pretend-play", "Child playing"), color: "sky" } },
        {
          type: "contact",
          props: {
            heading: "Come say hello",
            body: "Call, email or visit us. We are always happy to show families around.",
            phone: "+1 000 000 0000",
            email: "hello@example.com",
            address: "12 Rainbow Lane, Your City",
            hours: "Mon – Fri · 8:30 AM – 2:00 PM",
          },
        },
      ],
    },
  ],
};
