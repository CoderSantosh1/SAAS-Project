import type { ThemeDefinition } from "../../types";

const img = (name: string, alt: string) => ({ src: `/themes/crestview/${name}.jpg`, alt });

const stats = {
  items: [
    { value: "1962", label: "Year founded" },
    { value: "1,200+", label: "Students" },
    { value: "98%", label: "University placement" },
    { value: "40+", label: "Clubs and teams" },
  ],
};

const faculty = [
  { name: "Mr. Daniel Brooks", subject: "Head of Sciences", image: img("teacher-1", "Daniel Brooks") },
  { name: "Ms. Priya Nair", subject: "English Literature", image: img("teacher-2", "Priya Nair") },
  { name: "Ms. Elena Ruiz", subject: "Mathematics", image: img("teacher-3", "Elena Ruiz") },
  { name: "Mr. Samuel Okafor", subject: "Athletics Director", image: img("teacher-4", "Samuel Okafor") },
];

const visitCta = {
  type: "cta",
  props: {
    heading: "Come and see Crestview for yourself",
    body: "Join a guided campus tour and meet our teachers, students and families.",
    button: { label: "Book a campus tour", href: "/admissions" },
  },
};

// Crestview: a classic academy design inspired by the structure of popular school
// templates. The sample content below is what a new website starts with.
export const crestviewDefinition: ThemeDefinition = {
  componentId: "crestview",
  version: "1.0.0",
  name: "Crestview",
  slug: "crestview",
  description: "A classic green and gold design for schools and academies, with a campus hero, programs, news and events, and admissions steps.",
  authorName: "Lestow",
  primaryCategory: "school",
  categories: ["school", "college", "coaching-institute", "online-education"],
  isFeatured: true,
  supportedFeatures: ["multi-page", "responsive", "testimonials", "gallery", "contact-details"],
  compatibility: { minDocumentVersion: 1 },
  tokens: {
    primary: "#1F4D3A",
    onPrimary: "#FFFFFF",
    background: "#FBFAF6",
    surface: "#EEF2EC",
    text: "#17211C",
    mutedText: "#4E5A53",
    border: "#DDE4DB",
    headingFont: "lora",
    bodyFont: "inter",
    radius: "md",
  },
  pages: [
    {
      title: "Home",
      slug: "home",
      isHome: true,
      sections: [
        {
          type: "campus-hero",
          props: {
            eyebrow: "Grades 6 to 12 · Est. 1962",
            title: "Where curious minds become confident leaders",
            text: "A caring community with high expectations, small classes and a campus that inspires learning every day.",
            primaryButton: { label: "Apply for admission", href: "/admissions" },
            secondaryButton: { label: "Explore academics", href: "/academics" },
            image: img("campus", "Crestview main academic building"),
            facts: [
              { value: "1:14", label: "Teacher to student ratio" },
              { value: "25 acres", label: "Green campus" },
              { value: "IB & CBSE", label: "Curriculum options" },
              { value: "98%", label: "University placement" },
            ],
          },
        },
        {
          type: "quick-links",
          props: {
            items: [
              { title: "Admissions", text: "Applications for the new year", icon: "graduation-cap", href: "/admissions" },
              { title: "Academics", text: "Programs from Grade 6 to 12", icon: "book", href: "/academics" },
              { title: "Campus life", text: "Clubs, sports and the arts", icon: "trophy", href: "/campus-life" },
              { title: "Calendar", text: "Term dates and events", icon: "calendar", href: "/campus-life" },
            ],
          },
        },
        {
          type: "welcome",
          props: {
            eyebrow: "Welcome to Crestview",
            title: "Every student known, every talent nurtured",
            text: "For more than sixty years, Crestview has helped young people discover what they love and build the character to pursue it. Our teachers know each student by name, and our community celebrates every kind of success.",
            quote: "We do not just prepare students for exams. We prepare them for a life of learning, service and leadership.",
            name: "Dr. Margaret Hale",
            role: "Principal",
            image: img("graduate", "Principal at the graduation ceremony"),
            button: { label: "About our school", href: "/about" },
          },
        },
        { type: "stats", props: stats },
        {
          type: "programs",
          props: {
            eyebrow: "Academics",
            title: "Programs that open doors",
            text: "A broad, rigorous curriculum with the support each student needs to thrive.",
            items: [
              { title: "Middle School", tag: "Grades 6–8", text: "Strong foundations in literacy, numeracy and inquiry, with time to explore new interests.", image: img("raised-hand", "Student raising a hand in class"), href: "/academics" },
              { title: "High School", tag: "Grades 9–12", text: "Advanced courses, university counselling and leadership opportunities in every subject.", image: img("reading-class", "High school students reading in class"), href: "/academics" },
              { title: "Science & Technology", tag: "STEM", text: "Modern labs, robotics and coding clubs where students learn by building and testing.", image: img("science-lab", "Students in the science lab"), href: "/academics" },
            ],
          },
        },
        {
          type: "news-events",
          props: {
            eyebrow: "What's happening",
            title: "News and events",
            news: [
              { title: "Class of 2026 celebrates a record year of university offers", date: "18 Jun 2026", image: img("graduation", "Graduates throwing their caps"), href: "/campus-life" },
              { title: "New library learning commons opens to students", date: "2 May 2026", image: img("library", "The new library"), href: "/campus-life" },
              { title: "Crestview wins the regional science fair", date: "21 Apr 2026", image: img("writing", "Student working on a project"), href: "/campus-life" },
            ],
            eventsTitle: "Upcoming events",
            events: [
              { day: "14", month: "Nov", title: "Admissions open house", time: "10:00 AM – 1:00 PM", place: "Main hall" },
              { day: "22", month: "Nov", title: "Annual sports day", time: "8:30 AM onwards", place: "Crestview fields" },
              { day: "05", month: "Dec", title: "Winter concert", time: "6:00 PM", place: "Auditorium" },
            ],
          },
        },
        {
          type: "testimonials",
          props: {
            heading: "What our families say",
            items: [
              { quote: "Crestview gave our daughter the confidence to lead. The teachers saw her potential long before we did.", author: "Anita & Rajesh Kumar", role: "Parents, Grade 11" },
              { quote: "The science program is outstanding. I found my passion for engineering here.", author: "Arjun Mehta", role: "Class of 2025" },
              { quote: "A warm, safe community where every child is genuinely cared for.", author: "Sarah Thompson", role: "Parent, Grade 7" },
            ],
          },
        },
        visitCta,
      ],
    },
    {
      title: "About",
      slug: "about",
      sections: [
        { type: "page-header", props: { eyebrow: "About us", title: "Six decades of learning and leadership", text: "Our story, our values and the people who make Crestview special.", image: img("courtyard", "Students in the school courtyard") } },
        {
          type: "photo-points",
          props: {
            eyebrow: "Our mission",
            title: "Educating the whole child",
            text: "We combine academic excellence with care for character, wellbeing and community.",
            image: img("classroom", "Teacher presenting to a class"),
            points: [
              { title: "Academic excellence", text: "High standards and expert teaching in every subject.", icon: "award" },
              { title: "Character and service", text: "Students lead, volunteer and learn to make a difference.", icon: "users" },
              { title: "A safe, caring campus", text: "Wellbeing support and a culture of kindness and respect.", icon: "shield" },
            ],
          },
        },
        {
          type: "features",
          props: {
            heading: "Our values",
            subheading: "Six commitments that guide everything we do.",
            items: [
              { title: "Curiosity", description: "We ask questions, test ideas and love to learn." },
              { title: "Integrity", description: "We are honest, fair and take responsibility." },
              { title: "Respect", description: "We value every person and every voice." },
              { title: "Courage", description: "We try new things and learn from mistakes." },
              { title: "Excellence", description: "We give our best in class, on stage and on the field." },
              { title: "Service", description: "We look after each other and our community." },
            ],
          },
        },
        { type: "stats", props: stats },
        { type: "faculty", props: { eyebrow: "Leadership", title: "Meet our faculty", text: "Experienced, caring educators who bring every subject to life.", members: faculty } },
        visitCta,
      ],
    },
    {
      title: "Academics",
      slug: "academics",
      sections: [
        { type: "page-header", props: { eyebrow: "Academics", title: "A curriculum that challenges and inspires", text: "Grades 6 to 12, with IB and CBSE pathways.", image: img("reading-class", "Students reading in class") } },
        {
          type: "programs",
          props: {
            eyebrow: "Programs",
            title: "Find the right path",
            items: [
              { title: "Middle School", tag: "Grades 6–8", text: "Core subjects, languages, art and music, with project-based learning every term.", image: img("raised-hand", "Student raising a hand") },
              { title: "High School", tag: "Grades 9–12", text: "Advanced Placement style courses, electives and dedicated university counselling.", image: img("writing", "Student writing") },
              { title: "Science & Technology", tag: "STEM", text: "Physics, chemistry and biology labs, robotics, coding and an annual science fair.", image: img("science-lab", "Science lab") },
              { title: "Languages & Humanities", tag: "Global", text: "English, Hindi, French and Spanish, plus history, economics and debate.", image: img("library", "Library") },
              { title: "Arts & Music", tag: "Creative", text: "Studio art, drama, choir and orchestra with performances every term.", image: img("apple-books", "Books and an apple") },
              { title: "Sports & Wellbeing", tag: "Active", text: "Football, cricket, basketball and athletics, with fitness and mindfulness.", image: img("sports-field", "School sports field") },
            ],
          },
        },
        {
          type: "photo-points",
          props: {
            eyebrow: "How we teach",
            title: "Small classes, big ambitions",
            image: img("classroom", "Teacher with students"),
            imageRight: "yes",
            points: [
              { title: "Personal attention", text: "An average of 22 students per class.", icon: "users" },
              { title: "Modern learning spaces", text: "Smart classrooms, labs and a learning commons.", icon: "landmark" },
              { title: "Proven results", text: "Top board results and university offers worldwide.", icon: "trophy" },
            ],
          },
        },
        { type: "faculty", props: { eyebrow: "Our teachers", title: "Experts who care", members: faculty } },
      ],
    },
    {
      title: "Admissions",
      slug: "admissions",
      sections: [
        { type: "page-header", props: { eyebrow: "Admissions", title: "Join the Crestview family", text: "Applications are open for Grades 6 to 11.", image: img("students-walking", "Students walking to class") } },
        {
          type: "steps",
          props: {
            eyebrow: "How to apply",
            title: "Four simple steps",
            text: "Our admissions team will guide you at every stage.",
            items: [
              { title: "Enquire", text: "Send us your details and we will share the prospectus." },
              { title: "Visit", text: "Tour the campus and meet our teachers." },
              { title: "Apply", text: "Complete the application with previous school reports." },
              { title: "Welcome", text: "Meet the principal and confirm your place." },
            ],
            button: { label: "Contact admissions", href: "/contact" },
          },
        },
        {
          type: "faq",
          props: {
            eyebrow: "Admissions FAQ",
            title: "Questions parents often ask",
            items: [
              { question: "When do applications open?", answer: "Applications for the new academic year open in October and close at the end of January, subject to availability." },
              { question: "Is there an entrance assessment?", answer: "Students from Grade 7 upwards take a short assessment in English and Mathematics, followed by a friendly conversation." },
              { question: "Do you offer transport?", answer: "Yes. Our buses cover most parts of the city, with a trained attendant on every route." },
              { question: "Are scholarships available?", answer: "We offer merit and need-based scholarships each year. Ask our admissions team for details." },
            ],
          },
        },
        visitCta,
      ],
    },
    {
      title: "Campus Life",
      slug: "campus-life",
      sections: [
        { type: "page-header", props: { eyebrow: "Campus life", title: "More than a classroom", text: "Clubs, sports, the arts and friendships that last a lifetime.", image: img("sports-field", "Crestview sports fields") } },
        {
          type: "gallery",
          props: {
            heading: "A day at Crestview",
            images: [
              { ...img("graduation", "Graduation day"), caption: "Graduation day" },
              { ...img("library", "Library"), caption: "Learning commons" },
              { ...img("science-lab", "Science lab"), caption: "Science labs" },
              { ...img("courtyard", "Courtyard"), caption: "The courtyard" },
              { ...img("sports-field", "Sports field"), caption: "Sports fields" },
              { ...img("students-walking", "Students walking"), caption: "Between classes" },
              { ...img("classroom", "Classroom"), caption: "In class" },
              { ...img("reading-class", "Reading"), caption: "Reading hour" },
              { ...img("writing", "Writing"), caption: "Project work" },
            ],
          },
        },
        {
          type: "news-events",
          props: {
            title: "Coming up this term",
            news: [],
            eventsTitle: "Calendar",
            events: [
              { day: "14", month: "Nov", title: "Admissions open house", time: "10:00 AM – 1:00 PM", place: "Main hall" },
              { day: "22", month: "Nov", title: "Annual sports day", time: "8:30 AM onwards", place: "Crestview fields" },
              { day: "05", month: "Dec", title: "Winter concert", time: "6:00 PM", place: "Auditorium" },
              { day: "18", month: "Dec", title: "Last day of term", time: "12:30 PM dismissal" },
            ],
          },
        },
      ],
    },
    {
      title: "Contact",
      slug: "contact",
      sections: [
        { type: "page-header", props: { eyebrow: "Contact", title: "We would love to hear from you", image: img("campus", "Crestview campus") } },
        {
          type: "contact",
          props: {
            heading: "Visit, call or write to us",
            body: "Our office team will answer your questions about admissions, fees and school life.",
            phone: "+1 000 000 0000",
            email: "admissions@example.com",
            address: "100 College Road, Your City",
            hours: "Mon – Fri · 8:00 AM – 4:00 PM",
          },
        },
      ],
    },
  ],
};
