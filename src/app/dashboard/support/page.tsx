import type { Metadata } from "next";
import { AdminForm, Field, TextareaField } from "@/components/admin/admin-form";
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
    <div className="mx-auto max-w-3xl space-y-6">
      <PageTitle title="Help and Support" description="Tell us what you need, and we will reply here." />
      <Card className="p-6">
        <AdminForm action={createTicket} submitLabel="Send request" resetOnSuccess>
          <Field label="Subject" name="subject" required maxLength={200} />
          <TextareaField label="How can we help?" name="message" required maxLength={5000} rows={4} />
        </AdminForm>
      </Card>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Your requests</h2>
        {tickets.length === 0 && <p className="text-sm text-secondary-text">You have not sent any requests yet.</p>}
        {tickets.map((ticket) => (
          <Card key={ticket.id} className="p-5 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">{ticket.subject}</h3>
              <span className="text-xs font-semibold text-secondary-text capitalize">{ticket.status.replaceAll("_", " ")}</span>
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
