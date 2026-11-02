import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { AdminPage, DataTable, FilterBar, formatDate, Pagination, parseOffset, StatusBadge, Td } from "@/components/admin/admin-ui";
import { listCategoryOptions } from "@/features/themes/queries";
import { requireAdmin } from "@/lib/auth/session";
import { listWebsites } from "../panel-queries";

export const websitesMetadata: Metadata = { title: "Websites" };

const schema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  status: z.enum(["draft", "published", "unpublished", "suspended"]).optional().catch(undefined),
  category: z.uuid().optional().catch(undefined),
  owner: z.uuid().optional().catch(undefined),
  offset: z.string().optional().catch(undefined),
});

type Params = Record<string, string | string[] | undefined>;

// Shared by Websites and Published Websites, which differ only in their filter and copy.
export async function WebsitesList({
  params,
  path,
  title,
  description,
  publishedOnly = false,
  empty,
}: {
  params: Params;
  path: string;
  title: string;
  description: string;
  publishedOnly?: boolean;
  empty: string;
}) {
  await requireAdmin("websites.view");
  const { q, status, category, owner, offset: rawOffset } = schema.parse(params);
  const offset = parseOffset(rawOffset);
  const [{ rows, total }, categories] = await Promise.all([
    listWebsites({ search: q, status, categoryId: category, ownerId: owner, publishedOnly, offset }),
    listCategoryOptions(),
  ]);

  return (
    <AdminPage title={title} description={`${description} ${total} found.`}>
      <FilterBar
        action={path}
        search={q}
        placeholder="Search by name, address or owner email"
        selects={[
          {
            name: "status",
            label: "All statuses",
            value: status,
            options: ["draft", "published", "unpublished", "suspended"].map((value) => ({ value, label: value[0]!.toUpperCase() + value.slice(1) })),
          },
          { name: "category", label: "All categories", value: category, options: categories.map((option) => ({ value: option.id, label: option.name })) },
        ]}
      />
      <DataTable
        headers={publishedOnly ? ["Website", "Owner", "Theme", "Published", "Last updated", "Status", ""] : ["Website", "Owner", "Category", "Created", "Last updated", "Status", ""]}
        isEmpty={rows.length === 0}
        empty={empty}
      >
        {rows.map((website) => (
          <tr key={website.id}>
            <Td><p className="font-semibold text-foreground">{website.name}</p><p className="text-xs">{website.slug}</p></Td>
            <Td><Link href={`/admin/users/${website.owner_id}`} className="hover:underline">{website.owner_email}</Link></Td>
            <Td>{(publishedOnly ? website.theme_name : website.category_name) ?? "None"}</Td>
            <Td className="whitespace-nowrap">{formatDate(publishedOnly ? website.published_at : website.created_at)}</Td>
            <Td className="whitespace-nowrap">{formatDate(website.updated_at)}</Td>
            <Td><StatusBadge status={website.status} /></Td>
            <Td className="text-right"><Link href={`/admin/websites/${website.id}`} className="font-semibold text-primary-hover hover:underline">View</Link></Td>
          </tr>
        ))}
      </DataTable>
      <Pagination path={path} params={{ q, status, category, owner }} offset={offset} total={total} />
    </AdminPage>
  );
}
