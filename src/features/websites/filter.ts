// Filters the signed-in user's website list by status tab and search text. Kept free of
// server code so it is easy to test.
export const WEBSITE_TABS = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Drafts" },
  { value: "unpublished", label: "Unpublished" },
] as const;

export type WebsiteTab = (typeof WEBSITE_TABS)[number]["value"];

type Filterable = { name: string; slug: string; status: string; theme_name?: string | null; category_name?: string | null };

export function filterWebsites<T extends Filterable>(websites: T[], filters: { q?: string; status?: WebsiteTab }) {
  const search = filters.q?.trim().toLowerCase();
  return websites.filter(
    (website) =>
      (!filters.status || filters.status === "all" || website.status === filters.status) &&
      (!search ||
        [website.name, website.slug, website.theme_name, website.category_name].some((value) => value?.toLowerCase().includes(search))),
  );
}

export function countByTab(websites: { status: string }[]) {
  return Object.fromEntries(
    WEBSITE_TABS.map(({ value }) => [value, value === "all" ? websites.length : websites.filter((website) => website.status === value).length]),
  ) as Record<WebsiteTab, number>;
}
