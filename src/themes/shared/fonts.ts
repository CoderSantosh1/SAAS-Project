import { Inter, Lora, Playfair_Display, Sora, Space_Grotesk } from "next/font/google";

// The fonts a site can use. preload is off because each site needs only two of them.
const inter = Inter({ subsets: ["latin"], variable: "--font-site-inter", preload: false });
const sora = Sora({ subsets: ["latin"], variable: "--font-site-sora", preload: false });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-site-playfair", preload: false });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-site-space-grotesk", preload: false });
const lora = Lora({ subsets: ["latin"], variable: "--font-site-lora", preload: false });

export const siteFontClassName = [inter, sora, playfair, spaceGrotesk, lora]
  .map((font) => font.variable)
  .join(" ");
