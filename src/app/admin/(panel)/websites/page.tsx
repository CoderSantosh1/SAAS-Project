import type { Metadata } from "next";
import { WebsitesList } from "@/features/admin/components/websites-list";

export const metadata: Metadata = { title: "Websites" };

export default async function AdminWebsitesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <WebsitesList
      params={await searchParams}
      path="/admin/websites"
      title="Websites"
      description="Every website on the platform, including private drafts."
      empty="No websites match your filters."
    />
  );
}
