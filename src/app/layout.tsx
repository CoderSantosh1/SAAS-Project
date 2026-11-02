import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import type { ReactNode } from "react";
import { brand } from "@/config/brand";
import { getPlatformSettings } from "@/features/settings/queries";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const sora = Sora({ subsets: ["latin"], variable: "--font-sora" });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPlatformSettings();
  return {
    title: {
      default: settings.seoTitle || `${settings.name} | ${brand.tagline}`,
      template: `%s | ${settings.name}`,
    },
    description: settings.seoDescription || brand.description,
    icons: settings.faviconUrl ? { icon: settings.faviconUrl } : undefined,
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
