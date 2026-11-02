import type { Metadata } from "next";
import { WebsitesList } from "@/features/admin/components/websites-list";

export const metadata: Metadata = { title: "Published Websites" };

export default async function AdminPublishedWebsitesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <WebsitesList
      params={await searchParams}
      path="/admin/published-websites"
      title="Published Websites"
      description="Websites with a live version."
      publishedOnly
      empty="No published websites yet. Users can publish once the publishing phase is built."
    />
  );
}
