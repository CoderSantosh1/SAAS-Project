import type { ThemeDefinition } from "../../types";

// Lexora, ported from the original Next.js site. The sample content below is what a new
// website starts with; owners replace it in the editor.
export const lexoraDefinition: ThemeDefinition = {
  componentId: "lexora",
  version: "1.0.0",
  name: "Lexora",
  slug: "lexora",
  description: "A refined ivory and gold design for law firms, with a cinematic slideshow, practice cards and team profiles.",
  authorName: "Lestow",
  primaryCategory: "law-firm",
  categories: ["law-firm", "consulting", "financial-services", "corporate"],
  isFeatured: true,
  supportedFeatures: ["multi-page", "responsive", "slideshow", "testimonials", "gallery", "contact-details"],
  compatibility: { minDocumentVersion: 1 },
  tokens: {
    primary: "#86612C",
    onPrimary: "#FFFFFF",
    background: "#FAF7F2",
    surface: "#F2ECE2",
    text: "#1D1B18",
    mutedText: "#5F584E",
    border: "#E3D9CA",
    headingFont: "cormorant",
    bodyFont: "inter",
    radius: "lg",
  },
  pages: [
    {
      "title": "Home",
      "slug": "home",
      "isHome": true,
      "sections": [
        {
          "type": "slideshow",
          "props": {
            "slides": [
              {
                "image": {
                  "src": "/themes/lexora/consultation.jpg",
                  "alt": "Attorneys in a client consultation"
                },
                "line1": "Guiding Your",
                "line2": "Next Chapter"
              },
              {
                "image": {
                  "src": "/themes/lexora/lady-justice-bronze.jpg",
                  "alt": "Bronze statue of Lady Justice"
                },
                "line1": "Standing Firm",
                "line2": "For Your Rights"
              },
              {
                "image": {
                  "src": "/themes/lexora/law-library.jpg",
                  "alt": "Law library"
                },
                "line1": "Wisdom Behind",
                "line2": "Every Decision"
              }
            ]
          }
        },
        {
          "type": "intro-collage",
          "props": {
            "eyebrow": "Since 1998",
            "title": "Counsel with",
            "accent": "character.",
            "text": "Strategy, care and courtroom strength — under one roof.",
            "link": {
              "label": "Our story",
              "href": "/about"
            },
            "images": [
              {
                "src": "/themes/lexora/lady-justice.jpg",
                "alt": "Lady Justice"
              },
              {
                "src": "/themes/lexora/client-meeting.jpg",
                "alt": "Client meeting"
              },
              {
                "src": "/themes/lexora/law-library.jpg",
                "alt": "Law library"
              }
            ]
          }
        },
        {
          "type": "photo-cards",
          "props": {
            "eyebrow": "What we do",
            "title": "Practice",
            "accent": "Areas",
            "link": {
              "label": "View all",
              "href": "/practice-areas"
            },
            "items": [
              {
                "title": "Business & Corporate",
                "line": "Deals, governance and growth — structured to last.",
                "image": {
                  "src": "/themes/lexora/business-skyscrapers.jpg",
                  "alt": "Business & Corporate"
                },
                "icon": "briefcase",
                "href": "/practice-areas"
              },
              {
                "title": "Litigation & Disputes",
                "line": "Courtroom strength when it matters most.",
                "image": {
                  "src": "/themes/lexora/litigation-gavel.jpg",
                  "alt": "Litigation & Disputes"
                },
                "icon": "scales",
                "href": "/practice-areas"
              },
              {
                "title": "Personal & Family",
                "line": "Sensitive matters, handled with care.",
                "image": {
                  "src": "/themes/lexora/family.jpg",
                  "alt": "Personal & Family"
                },
                "icon": "family",
                "href": "/practice-areas"
              },
              {
                "title": "Property & Real Estate",
                "line": "Every square foot, legally sound.",
                "image": {
                  "src": "/themes/lexora/property-house.jpg",
                  "alt": "Property & Real Estate"
                },
                "icon": "home",
                "href": "/practice-areas"
              },
              {
                "title": "Legal Advisory",
                "line": "Clear answers before problems begin.",
                "image": {
                  "src": "/themes/lexora/advisory-signing.jpg",
                  "alt": "Legal Advisory"
                },
                "icon": "doc",
                "href": "/practice-areas"
              }
            ]
          }
        },
        {
          "type": "quote-banner",
          "props": {
            "image": {
              "src": "/themes/lexora/courthouse-columns.jpg",
              "alt": "Classical courthouse columns"
            },
            "quote": "Excellence is not an act,",
            "accent": "it is our habit."
          }
        },
        {
          "type": "stats",
          "props": {
            "items": [
              {
                "value": "25+",
                "label": "Years"
              },
              {
                "value": "1,200+",
                "label": "Cases Won"
              },
              {
                "value": "98%",
                "label": "Success Rate"
              },
              {
                "value": "40",
                "label": "Attorneys"
              }
            ]
          }
        },
        {
          "type": "team",
          "props": {
            "eyebrow": "The counsel",
            "title": "Meet the",
            "accent": "Team",
            "link": {
              "label": "View all",
              "href": "/team"
            },
            "members": [
              {
                "name": "Arjun Mehra",
                "role": "Managing Partner",
                "image": {
                  "src": "/themes/lexora/arjun-mehra.jpg",
                  "alt": "Arjun Mehra"
                }
              },
              {
                "name": "Sophia Laurent",
                "role": "Senior Litigator",
                "image": {
                  "src": "/themes/lexora/sophia-laurent.jpg",
                  "alt": "Sophia Laurent"
                }
              },
              {
                "name": "Daniel Whitmore",
                "role": "Corporate Counsel",
                "image": {
                  "src": "/themes/lexora/daniel-whitmore.jpg",
                  "alt": "Daniel Whitmore"
                }
              },
              {
                "name": "Priya Kapoor",
                "role": "Family Law",
                "image": {
                  "src": "/themes/lexora/priya-kapoor.jpg",
                  "alt": "Priya Kapoor"
                }
              }
            ]
          }
        },
        {
          "type": "testimonials",
          "props": {
            "heading": "What clients say",
            "items": [
              {
                "quote": "They structured our acquisition in six weeks and caught two risks our bankers missed. Calm, sharp and always available.",
                "author": "Karan Bhatia",
                "role": "Founder, Northwind Foods"
              },
              {
                "quote": "After two years in court elsewhere, Lexora settled our dispute in four months — on our terms.",
                "author": "Meera Iyer",
                "role": "Director, Iyer Textiles"
              },
              {
                "quote": "A painful time made bearable. They explained every step and kept my children's interests first.",
                "author": "Neha Sharma",
                "role": "Private client"
              },
              {
                "quote": "Their title check stopped me from buying a flat with a hidden dispute. Worth every rupee.",
                "author": "Rahul Verma",
                "role": "Home buyer, Gurugram"
              },
              {
                "quote": "Our monthly retainer feels like having a senior lawyer on the team. Quick, clear answers every time.",
                "author": "Aisha Khan",
                "role": "COO, Brightpath Health"
              },
              {
                "quote": "Professional from the first call. They told us honestly what to expect — and then delivered better.",
                "author": "Sameer Joshi",
                "role": "Partner, Joshi & Co."
              }
            ]
          }
        },
        {
          "type": "cta",
          "props": {
            "heading": "The Right Guidance. A Stronger Way Forward.",
            "button": {
              "label": "Book a Consultation",
              "href": "/contact"
            }
          }
        }
      ]
    },
    {
      "title": "About",
      "slug": "about",
      "sections": [
        {
          "type": "page-hero",
          "props": {
            "eyebrow": "About us",
            "title": "Built on trust.",
            "line": "Three decades of counsel, one promise.",
            "image": {
              "src": "/themes/lexora/boardroom.jpg",
              "alt": "Lexora boardroom"
            }
          }
        },
        {
          "type": "about",
          "props": {
            "heading": "Our Story",
            "body": "Since 1998, we have helped individuals and businesses navigate complex legal challenges with clarity, integrity and purpose. Our approach combines thoughtful strategy with personal attention, keeping your interests at the heart of every decision.",
            "image": {
              "src": "/themes/lexora/law-library.jpg",
              "alt": "Lexora law library"
            }
          }
        },
        {
          "type": "features",
          "props": {
            "heading": "How we work",
            "items": [
              {
                "title": "Consultation",
                "description": "We listen, review your documents and explain where you stand."
              },
              {
                "title": "Strategy",
                "description": "A clear plan with options, timelines and costs — in writing."
              },
              {
                "title": "Action",
                "description": "Drafting, negotiation or court work, led by one partner."
              },
              {
                "title": "Resolution",
                "description": "We close the matter and stay available for what comes next."
              }
            ]
          }
        },
        {
          "type": "image-strip",
          "props": {
            "images": [
              {
                "src": "/themes/lexora/boardroom.jpg",
                "alt": "Lexora boardroom"
              },
              {
                "src": "/themes/lexora/lady-justice.jpg",
                "alt": "Lady Justice statue"
              },
              {
                "src": "/themes/lexora/client-meeting.jpg",
                "alt": "Client meeting"
              },
              {
                "src": "/themes/lexora/law-library.jpg",
                "alt": "Law library"
              },
              {
                "src": "/themes/lexora/handshake.jpg",
                "alt": "Agreement handshake"
              },
              {
                "src": "/themes/lexora/courthouse.jpg",
                "alt": "Courthouse facade"
              },
              {
                "src": "/themes/lexora/office-window.jpg",
                "alt": "Workspace by the window"
              },
              {
                "src": "/themes/lexora/suit-cuff.jpg",
                "alt": "Partner preparing for court"
              }
            ]
          }
        },
        {
          "type": "cta",
          "props": {
            "heading": "The Right Guidance. A Stronger Way Forward.",
            "button": {
              "label": "Book a Consultation",
              "href": "/contact"
            }
          }
        }
      ]
    },
    {
      "title": "Practice Areas",
      "slug": "practice-areas",
      "sections": [
        {
          "type": "page-hero",
          "props": {
            "eyebrow": "What we do",
            "title": "Practice Areas",
            "line": "Five disciplines. One standard.",
            "image": {
              "src": "/themes/lexora/library.jpg",
              "alt": "Law library"
            }
          }
        },
        {
          "type": "photo-cards",
          "props": {
            "eyebrow": "Our expertise",
            "title": "Five",
            "accent": "disciplines",
            "items": [
              {
                "title": "Business & Corporate",
                "line": "Deals, governance and growth — structured to last.",
                "image": {
                  "src": "/themes/lexora/business-skyscrapers.jpg",
                  "alt": "Business & Corporate"
                },
                "icon": "briefcase"
              },
              {
                "title": "Litigation & Disputes",
                "line": "Courtroom strength when it matters most.",
                "image": {
                  "src": "/themes/lexora/litigation-gavel.jpg",
                  "alt": "Litigation & Disputes"
                },
                "icon": "scales"
              },
              {
                "title": "Personal & Family",
                "line": "Sensitive matters, handled with care.",
                "image": {
                  "src": "/themes/lexora/family.jpg",
                  "alt": "Personal & Family"
                },
                "icon": "family"
              },
              {
                "title": "Property & Real Estate",
                "line": "Every square foot, legally sound.",
                "image": {
                  "src": "/themes/lexora/property-house.jpg",
                  "alt": "Property & Real Estate"
                },
                "icon": "home"
              },
              {
                "title": "Legal Advisory",
                "line": "Clear answers before problems begin.",
                "image": {
                  "src": "/themes/lexora/advisory-signing.jpg",
                  "alt": "Legal Advisory"
                },
                "icon": "doc"
              }
            ]
          }
        },
        {
          "type": "services",
          "props": {
            "heading": "Business & Corporate",
            "subheading": "Deals, governance and growth — structured to last.",
            "items": [
              {
                "name": "Mergers & Acquisitions",
                "description": "Due diligence, valuation support and deal documents from term sheet to closing."
              },
              {
                "name": "Contracts",
                "description": "Vendor, client and partnership agreements written to prevent disputes, not invite them."
              },
              {
                "name": "Compliance",
                "description": "ROC filings, board resolutions and statutory registers kept current all year."
              },
              {
                "name": "Startups",
                "description": "Incorporation, ESOPs, founder agreements and investor rounds done right the first time."
              },
              {
                "name": "Employment",
                "description": "Offer letters, HR policies, POSH committees and exits handled with care."
              },
              {
                "name": "Joint Ventures",
                "description": "Clear structures for shared ownership, control and a clean exit if needed."
              }
            ]
          }
        },
        {
          "type": "cta",
          "props": {
            "heading": "The Right Guidance. A Stronger Way Forward.",
            "button": {
              "label": "Book a Consultation",
              "href": "/contact"
            }
          }
        }
      ]
    },
    {
      "title": "Team",
      "slug": "team",
      "sections": [
        {
          "type": "page-hero",
          "props": {
            "eyebrow": "The counsel",
            "title": "Our Team",
            "line": "Forty minds. One table.",
            "image": {
              "src": "/themes/lexora/team-meeting.jpg",
              "alt": "Lexora team meeting"
            }
          }
        },
        {
          "type": "team",
          "props": {
            "eyebrow": "Partners & associates",
            "title": "Meet the",
            "accent": "Attorneys",
            "members": [
              {
                "name": "Arjun Mehra",
                "role": "Managing Partner",
                "image": {
                  "src": "/themes/lexora/arjun-mehra.jpg",
                  "alt": "Arjun Mehra"
                }
              },
              {
                "name": "Sophia Laurent",
                "role": "Senior Litigator",
                "image": {
                  "src": "/themes/lexora/sophia-laurent.jpg",
                  "alt": "Sophia Laurent"
                }
              },
              {
                "name": "Daniel Whitmore",
                "role": "Corporate Counsel",
                "image": {
                  "src": "/themes/lexora/daniel-whitmore.jpg",
                  "alt": "Daniel Whitmore"
                }
              },
              {
                "name": "Priya Kapoor",
                "role": "Family Law",
                "image": {
                  "src": "/themes/lexora/priya-kapoor.jpg",
                  "alt": "Priya Kapoor"
                }
              },
              {
                "name": "Rohan Malhotra",
                "role": "Real Estate",
                "image": {
                  "src": "/themes/lexora/rohan-malhotra.jpg",
                  "alt": "Rohan Malhotra"
                }
              },
              {
                "name": "Elena Russo",
                "role": "Arbitration",
                "image": {
                  "src": "/themes/lexora/elena-russo.jpg",
                  "alt": "Elena Russo"
                }
              },
              {
                "name": "Vikram Sethi",
                "role": "Senior Partner",
                "image": {
                  "src": "/themes/lexora/vikram-sethi.jpg",
                  "alt": "Vikram Sethi"
                }
              },
              {
                "name": "Ananya Rao",
                "role": "Advisory",
                "image": {
                  "src": "/themes/lexora/ananya-rao.jpg",
                  "alt": "Ananya Rao"
                }
              }
            ]
          }
        }
      ]
    },
    {
      "title": "Testimonials",
      "slug": "testimonials",
      "sections": [
        {
          "type": "page-hero",
          "props": {
            "eyebrow": "Client stories",
            "title": "Testimonials",
            "line": "In our clients' own words.",
            "image": {
              "src": "/themes/lexora/handshake.jpg",
              "alt": "Agreement handshake"
            }
          }
        },
        {
          "type": "testimonials",
          "props": {
            "heading": "What clients say",
            "items": [
              {
                "quote": "They structured our acquisition in six weeks and caught two risks our bankers missed. Calm, sharp and always available.",
                "author": "Karan Bhatia",
                "role": "Founder, Northwind Foods"
              },
              {
                "quote": "After two years in court elsewhere, Lexora settled our dispute in four months — on our terms.",
                "author": "Meera Iyer",
                "role": "Director, Iyer Textiles"
              },
              {
                "quote": "A painful time made bearable. They explained every step and kept my children's interests first.",
                "author": "Neha Sharma",
                "role": "Private client"
              },
              {
                "quote": "Their title check stopped me from buying a flat with a hidden dispute. Worth every rupee.",
                "author": "Rahul Verma",
                "role": "Home buyer, Gurugram"
              },
              {
                "quote": "Our monthly retainer feels like having a senior lawyer on the team. Quick, clear answers every time.",
                "author": "Aisha Khan",
                "role": "COO, Brightpath Health"
              },
              {
                "quote": "Professional from the first call. They told us honestly what to expect — and then delivered better.",
                "author": "Sameer Joshi",
                "role": "Partner, Joshi & Co."
              }
            ]
          }
        }
      ]
    },
    {
      "title": "Gallery",
      "slug": "gallery",
      "sections": [
        {
          "type": "page-hero",
          "props": {
            "eyebrow": "Inside Lexora",
            "title": "Gallery",
            "line": "Our spaces, our moments.",
            "image": {
              "src": "/themes/lexora/office-loft.jpg",
              "alt": "Open office"
            }
          }
        },
        {
          "type": "gallery",
          "props": {
            "images": [
              {
                "src": "/themes/lexora/boardroom.jpg",
                "alt": "Lexora boardroom",
                "caption": "Office"
              },
              {
                "src": "/themes/lexora/lady-justice.jpg",
                "alt": "Lady Justice statue",
                "caption": "Courtroom"
              },
              {
                "src": "/themes/lexora/client-meeting.jpg",
                "alt": "Client meeting",
                "caption": "Moments"
              },
              {
                "src": "/themes/lexora/law-library.jpg",
                "alt": "Law library",
                "caption": "Office"
              },
              {
                "src": "/themes/lexora/handshake.jpg",
                "alt": "Agreement handshake",
                "caption": "Moments"
              },
              {
                "src": "/themes/lexora/courthouse.jpg",
                "alt": "Courthouse facade",
                "caption": "Courtroom"
              },
              {
                "src": "/themes/lexora/office-window.jpg",
                "alt": "Workspace by the window",
                "caption": "Office"
              },
              {
                "src": "/themes/lexora/suit-cuff.jpg",
                "alt": "Partner preparing for court",
                "caption": "Moments"
              },
              {
                "src": "/themes/lexora/litigation-gavel.jpg",
                "alt": "Judge's gavel",
                "caption": "Courtroom"
              },
              {
                "src": "/themes/lexora/meeting-rooms.jpg",
                "alt": "Glass meeting rooms",
                "caption": "Office"
              },
              {
                "src": "/themes/lexora/contract-signing.jpg",
                "alt": "Signing a contract",
                "caption": "Moments"
              },
              {
                "src": "/themes/lexora/courthouse-columns.jpg",
                "alt": "Classical columns",
                "caption": "Courtroom"
              },
              {
                "src": "/themes/lexora/office-loft.jpg",
                "alt": "Open office",
                "caption": "Office"
              },
              {
                "src": "/themes/lexora/strategy-session.jpg",
                "alt": "Strategy session",
                "caption": "Moments"
              }
            ]
          }
        }
      ]
    },
    {
      "title": "FAQ",
      "slug": "faq",
      "sections": [
        {
          "type": "page-hero",
          "props": {
            "eyebrow": "Help centre",
            "title": "FAQ",
            "line": "Quick answers to common questions.",
            "image": {
              "src": "/themes/lexora/library.jpg",
              "alt": "Law library"
            }
          }
        },
        {
          "type": "faq",
          "props": {
            "eyebrow": "Good to know",
            "title": "Common",
            "accent": "questions",
            "items": [
              {
                "question": "Which areas of law do you handle?",
                "answer": "Business and corporate, litigation and disputes, personal and family, property and real estate, and general legal advisory."
              },
              {
                "question": "Where are your offices?",
                "answer": "Our main office is in Gurugram, and we serve clients across the NCR and the rest of India, in person or online."
              },
              {
                "question": "Will my information be kept confidential?",
                "answer": "Always. Everything you share with us is protected by attorney–client privilege from the very first conversation."
              },
              {
                "question": "How do you charge?",
                "answer": "Depending on the matter, we work on a fixed fee, an hourly rate or a monthly retainer. You will get the fee in writing before any work starts."
              },
              {
                "question": "Is the first consultation free?",
                "answer": "The first 30-minute consultation is complimentary, so you can understand your options before committing."
              },
              {
                "question": "Are there any hidden costs?",
                "answer": "No. Court fees and other external costs are listed separately in your estimate, and we tell you before anything changes."
              }
            ]
          }
        }
      ]
    },
    {
      "title": "Contact",
      "slug": "contact",
      "sections": [
        {
          "type": "page-hero",
          "props": {
            "eyebrow": "Contact",
            "title": "Let's talk.",
            "line": "We reply within 24 hours.",
            "image": {
              "src": "/themes/lexora/office-window.jpg",
              "alt": "Lexora reception"
            }
          }
        },
        {
          "type": "contact",
          "props": {
            "heading": "Get in touch",
            "body": "Book a consultation or ask us anything.",
            "email": "hello@example.com",
            "phone": "+91 00000 00000",
            "address": "1234 Main Street, Suite 100, Springfield, IL 62701, USA",
            "hours": "Mon – Sat · 9:00 – 19:00"
          }
        }
      ]
    }
  ],
};
