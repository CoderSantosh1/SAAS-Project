import type { Metadata } from "next";
import { z } from "zod";
import { AdminPage, DataTable, FilterBar, Pagination, parseOffset, Td } from "@/components/admin/admin-ui";
import { listActivity } from "@/features/admin/panel-queries";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Activity Logs" };

const schema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  offset: z.string().optional().catch(undefined),
});

export default async function AdminActivityLogsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin("activity_logs.view");
  const { q, offset: rawOffset } = schema.parse(await searchParams);
  const offset = parseOffset(rawOffset);
  const { rows, total } = await listActivity(q, offset);

  return (
    <AdminPage title="Activity Logs" description={`${total} ${total === 1 ? "record" : "records"}. These cannot be changed or deleted.`}>
      <FilterBar action="/admin/activity-logs" search={q} placeholder="Search by action, admin email or target" />
      <DataTable headers={["Time", "Admin", "Action", "Target", "Details"]} isEmpty={rows.length === 0} empty="No activity matches your search.">
        {rows.map((row) => (
          <tr key={row.id}>
            <Td className="whitespace-nowrap">{new Date(row.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</Td>
            <Td>{row.actor_email ?? "System"}</Td>
            <Td className="font-semibold text-foreground">{row.action}</Td>
            <Td className="max-w-48 break-all text-xs">{row.target_type ? `${row.target_type}: ${row.target_id ?? ""}` : "None"}</Td>
            <Td className="max-w-64 text-xs break-words">{Object.keys(row.metadata ?? {}).length ? JSON.stringify(row.metadata) : "None"}</Td>
          </tr>
        ))}
      </DataTable>
      <Pagination path="/admin/activity-logs" params={{ q }} offset={offset} total={total} />
    </AdminPage>
  );
}
