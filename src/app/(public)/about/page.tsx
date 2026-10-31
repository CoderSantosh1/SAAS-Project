import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, PUBLIC_CONTAINER } from "@/components/public/page-header";
import { buttonVariants } from "@/components/ui/button";
import { brand } from "@/config/brand";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className={`${PUBLIC_CONTAINER} py-14 sm:py-20`}>
      <PageHeader title={`About ${brand.name}`} description={brand.description} />
      <div className="mt-8 max-w-2xl space-y-4 text-secondary-text">
        <p>
          A good website should not require a developer. {brand.name} is for individuals, businesses,
          freelancers, agencies and startups who want a professional presence online and would rather
          spend their time on their work.
        </p>
        <p>
          Pick a theme made for your field, change anything you like and publish when you are ready.
          Your drafts stay private until then, and everything you build is managed from one dashboard.
        </p>
      </div>
      <Link href="/templates" className={`${buttonVariants({ size: "lg" })} mt-8`}>
        Explore Templates
      </Link>
    </div>
  );
}
