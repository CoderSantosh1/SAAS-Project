import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { AdminForm, SelectField, TextareaField } from "@/components/admin/admin-form";
import { AdminPage, FilterBar, formatDate, Pagination, parseOffset, StatusBadge } from "@/components/admin/admin-ui";
import { Card } from "@/components/ui/card";
import { updateTicket } from "@/features/admin/panel-actions";
import { listTickets } from "@/features/admin/panel-queries";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Support Tickets" };

const STATUSES = ["open", "in_progress", "resolved", "closed"];
const PRIORITIES = ["low", "normal", "high", "urgent"];
const label = (value: string) => (value[0]!.toUpperCase() + value.slice(1)).replaceAll("_", " ");
const options = (values: string[]) => values.map((value) => ({ value, label: label(value) }));

const schema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  status: z.enum(["open", "in_progress", "resolved", "closed"]).optional().catch(undefined),
  offset: z.string().optional().catch(undefined),
});

export default async function AdminSupportPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin("support.manage");
  const { q, status, offset: rawOffset } = schema.parse(await searchParams);
  const offset = parseOffset(rawOffset);
  const { rows, total } = await listTickets(status, q, offset);

  return (
    <AdminPage narrow title="Support Tickets" description={`${total} found. Replies are shown to the user in Help and Support.`}>
      <FilterBar action="/admin/support" search={q} placeholder="Search by subject or email" selects={[{ name: "status", label: "All statuses", value: status, options: options(STATUSES) }]} />
      {rows.length === 0 && <Card className="p-10 text-center text-sm text-secondary-text">No tickets match your filters.</Card>}
      {rows.map((ticket) => (
        <Card key={ticket.id} className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">{ticket.subject}</h2>
            <StatusBadge status={ticket.status} />
            <StatusBadge status={ticket.priority} />
          </div>
          <p className="mt-1 text-xs text-secondary-text">
            <Link href={`/admin/users/${ticket.user_id}`} className="hover:underline">{ticket.user_email}</Link>
            {ticket.website_name && `, ${ticket.website_name}`}, {formatDate(ticket.created_at)}
            {ticket.assignee_email && `, handled by ${ticket.assignee_email}`}
          </p>
          <p className="mt-3 text-sm whitespace-pre-line">{ticket.message}</p>
          <div className="mt-4 border-t border-border pt-4">
            <AdminForm action={updateTicket.bind(null, ticket.id)} submitLabel="Save ticket" submitVariant="secondary">
              <TextareaField label="Reply to the user" name="admin_response" maxLength={5000} defaultValue={ticket.admin_response ?? ""} />
              <div className="grid gap-3 sm:grid-cols-2">
                <SelectField label="Status" name="status" defaultValue={ticket.status} options={options(STATUSES)} />
                <SelectField label="Priority" name="priority" defaultValue={ticket.priority} options={options(PRIORITIES)} />
              </div>
            </AdminForm>
          </div>
        </Card>
      ))}
      <Pagination path="/admin/support" params={{ q, status }} offset={offset} total={total} />
    </AdminPage>
  );
}
