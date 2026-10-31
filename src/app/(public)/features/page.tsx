import { Eye, FileStack, Globe, Image as ImageIcon, LayoutDashboard, Palette } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, PUBLIC_CONTAINER } from "@/components/public/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Features" };

const FEATURES = [
  { icon: Palette, title: "Professional themes", text: "Start from designs made for your kind of business, then make them your own." },
  { icon: FileStack, title: "Multiple pages", text: "Home, About, Services, Contact and any custom pages you need." },
  { icon: Eye, title: "Preview on every device", text: "Check how your website looks on desktop, tablet and mobile before it goes live." },
  { icon: ImageIcon, title: "Media library", text: "Keep your images and logos in one place and reuse them anywhere." },
  { icon: Globe, title: "Free subdomain", text: "Publish on your own free web address, with your drafts kept private until you are ready." },
  { icon: LayoutDashboard, title: "One dashboard", text: "Create, edit and manage all of your websites from a single place." },
];

export default function FeaturesPage() {
  return (
    <div className={`${PUBLIC_CONTAINER} py-14 sm:py-20`}>
      <PageHeader
        title="Everything you need to get online"
        description="Build a professional website without writing a line of code."
      />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <Card key={title} className="p-6">
            <Icon className="size-6 text-primary" aria-hidden />
            <h2 className="mt-4 text-lg font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-secondary-text">{text}</p>
          </Card>
        ))}
      </div>
      <div className="mt-12">
        <Link href="/register" className={buttonVariants({ size: "lg" })}>
          Start Building Free
        </Link>
      </div>
    </div>
  );
}
