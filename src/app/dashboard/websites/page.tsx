import { Globe, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle } from "@/components/user/page-title";
import { WebsiteCard } from "@/components/user/website-card";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listMyWebsites } from "@/features/websites/queries";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "My Websites" };

export default async function MyWebsitesPage() {
  await requireUser();
  const websites = await listMyWebsites();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageTitle
        title="My Websites"
        description="Everything you have built, in one place."
        action={
          <Link href="/dashboard/create-website" className={buttonVariants()}>
            <Plus className="size-4" aria-hidden />
            Create Website
          </Link>
        }
      />

      {websites.length === 0 ? (
        <Card className="flex flex-col items-center p-12 text-center">
          <Globe className="size-10 text-accent" aria-hidden />
          <h2 className="mt-4 text-lg font-semibold">You have no websites yet</h2>
          <p className="mt-1 max-w-sm text-sm text-secondary-text">
            Choose a theme and your first website will be ready in about a minute.
          </p>
          <Link href="/dashboard/create-website" className={`${buttonVariants()} mt-5`}>
            Create your first website
          </Link>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {websites.map((website) => (
            <WebsiteCard key={website.id} website={website} />
          ))}
        </div>
      )}
    </div>
  );
}
