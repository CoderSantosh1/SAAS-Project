import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { AdminPage, DataTable, FilterBar, formatDate, Pagination, parseOffset, StatusBadge, Td } from "@/components/admin/admin-ui";
import { listUsers } from "@/features/admin/panel-queries";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Users" };

const schema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  status: z.enum(["active", "suspended"]).optional().catch(undefined),
  offset: z.string().optional().catch(undefined),
});

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin("users.view");
  const { q, status, offset: rawOffset } = schema.parse(await searchParams);
  const offset = parseOffset(rawOffset);
  const { rows, total } = await listUsers(q, status, offset);

  return (
    <AdminPage title="Users" description={`${total} ${total === 1 ? "user" : "users"} found.`}>
      <FilterBar
        action="/admin/users"
        search={q}
        placeholder="Search by name, email or ID"
        selects={[{ name: "status", label: "All statuses", value: status, options: [{ value: "active", label: "Active" }, { value: "suspended", label: "Suspended" }] }]}
      />
      <DataTable headers={["User", "Status", "Registered", "Websites", "Published", ""]} isEmpty={rows.length === 0} empty="No users match your filters.">
        {rows.map((user) => (
          <tr key={user.id}>
            <Td>
              <p className="font-semibold text-foreground">{user.full_name ?? "No name"}</p>
              <p className="text-xs">{user.email}</p>
              <p className="text-xs text-muted-text">{user.id}</p>
            </Td>
            <Td><StatusBadge status={user.account_status} /></Td>
            <Td className="whitespace-nowrap">{formatDate(user.created_at)}</Td>
            <Td>{user.website_count}</Td>
            <Td>{user.published_count}</Td>
            <Td className="text-right"><Link href={`/admin/users/${user.id}`} className="font-semibold text-primary-hover hover:underline">View</Link></Td>
          </tr>
        ))}
      </DataTable>
      <Pagination path="/admin/users" params={{ q, status }} offset={offset} total={total} />
    </AdminPage>
  );
}
