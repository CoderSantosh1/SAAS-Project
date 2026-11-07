import type { Metadata } from "next";
import { Clock, LifeBuoy, MessageSquare } from "lucide-react";
import { AdminForm, Field, TextareaField } from "@/components/admin/admin-form";
import { formatDate, StatusBadge } from "@/components/admin/admin-ui";
import { EmptyState } from "@/components/shared/empty-state";
import { PageTitle } from "@/components/user/page-title";
import { Card } from "@/components/ui/card";
import { createTicket } from "@/features/users/support-actions";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Help and Support" };

type Ticket = { id: string; subject: string; message: string; status: string; admin_response: string | null; created_at: string };

export default async function SupportPage() {
  const profile = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("support_tickets")
    .select("id, subject, message, status, admin_response, created_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(`Could not load requests: ${error.message}`);
  const tickets = (data ?? []) as Ticket[];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageTitle title="Help and Support" description="Tell us what you need, and we will reply here." />
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="p-6">
          <h2 className="text-lg font-semibold">Send a request</h2>
          <p className="mt-1 mb-5 text-sm text-secondary-text">Describe the problem or question. Include the website name if it is about a site.</p>
          <AdminForm action={createTicket} submitLabel="Send request" resetOnSuccess>
            <Field label="Subject" name="subject" required maxLength={200} />
            <TextareaField label="How can we help?" name="message" required maxLength={5000} rows={5} />
          </AdminForm>
        </Card>
        <Card className="space-y-4 bg-gradient-to-br from-primary-light to-surface p-6">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/30">
            <LifeBuoy className="size-5" aria-hidden />
          </span>
          <h2 className="text-lg font-semibold">We are here to help</h2>
          <ul className="space-y-3 text-sm text-secondary-text">
            <li className="flex gap-2.5">
              <Clock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              Most requests get a reply within one working day.
            </li>
            <li className="flex gap-2.5">
              <MessageSquare className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              Replies appear below, under your request.
            </li>
          </ul>
        </Card>
      </div>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Your requests</h2>
        {tickets.length === 0 && (
          <Card>
            <EmptyState icon={MessageSquare} title="No requests yet" text="When you send a request, it shows up here with our reply." />
          </Card>
        )}
        {tickets.map((ticket) => (
          <Card key={ticket.id} className="p-5 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">{ticket.subject}</h3>
              <span className="flex items-center gap-3">
                <span className="text-xs text-secondary-text">{formatDate(ticket.created_at)}</span>
                <StatusBadge status={ticket.status} />
              </span>
            </div>
            <p className="mt-2 whitespace-pre-line text-secondary-text">{ticket.message}</p>
            {ticket.admin_response && (
              <div className="mt-3 rounded-md bg-primary-light px-3 py-2">
                <p className="text-xs font-semibold text-primary-hover">Our reply</p>
                <p className="mt-1 whitespace-pre-line">{ticket.admin_response}</p>
              </div>
            )}
          </Card>
        ))}
      </section>
    </div>
  );
}
