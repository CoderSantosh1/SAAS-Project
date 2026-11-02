import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AdminForm, CheckField, TextareaField } from "@/components/admin/admin-form";
import { AdminPage, DataTable, formatDate, StatusBadge, Td } from "@/components/admin/admin-ui";
import { Card } from "@/components/ui/card";
import { setUserRoles, setUserStatus } from "@/features/admin/panel-actions";
import { getUser } from "@/features/admin/panel-queries";
import { requireAdmin } from "@/lib/auth/session";
import { can } from "@/lib/permissions";

export const metadata: Metadata = { title: "User details" };

const ROLES = [
  { slug: "super_admin", label: "Super Admin" },
  { slug: "platform_admin", label: "Platform Admin" },
  { slug: "content_manager", label: "Content Manager" },
  { slug: "support_admin", label: "Support Admin" },
];

export default async function AdminUserPage({ params }: { params: Promise<{ userId: string }> }) {
  const { access, profile } = await requireAdmin("users.view");
  const { userId } = await params;
  if (!z.uuid().safeParse(userId).success) notFound();

  const user = await getUser(userId);
  if (!user) notFound();

  const suspended = user.account_status === "suspended";

  return (
    <AdminPage title={user.full_name ?? user.email} description={user.email} back={{ href: "/admin/users", label: "Users" }} action={<StatusBadge status={user.account_status} />}>
      <Card className="grid gap-3 p-5 text-sm sm:grid-cols-3">
        <div><p className="text-xs text-secondary-text">Registered</p><p className="font-medium">{formatDate(user.created_at)}</p></div>
        <div><p className="text-xs text-secondary-text">User ID</p><p className="font-medium break-all">{user.id}</p></div>
        <div><p className="text-xs text-secondary-text">Admin roles</p><p className="font-medium">{user.roles.length ? user.roles.join(", ") : "None"}</p></div>
        {suspended && (
          <div className="sm:col-span-3"><p className="text-xs text-secondary-text">Suspended {formatDate(user.suspended_at)}</p><p className="font-medium">{user.suspended_reason ?? "No reason recorded"}</p></div>
        )}
      </Card>

      {can(access, "users.manage") && user.id !== profile.id && (
        <Card className="p-5">
          <h2 className="mb-3 font-semibold">{suspended ? "Restore account" : "Suspend account"}</h2>
          {suspended ? (
            <AdminForm action={setUserStatus.bind(null, user.id, "active")} submitLabel="Restore account">
              <p className="text-sm text-secondary-text">The user can sign in and make changes again.</p>
            </AdminForm>
          ) : (
            <AdminForm action={setUserStatus.bind(null, user.id, "suspended")} submitLabel="Suspend account" submitVariant="danger">
              <p className="text-sm text-secondary-text">Their data is kept. They cannot make changes, and their live websites go offline.</p>
              <TextareaField label="Reason (recorded in the activity log)" name="reason" maxLength={500} />
            </AdminForm>
          )}
        </Card>
      )}

      {access.isSuper && (
        <Card className="p-5">
          <h2 className="mb-3 font-semibold">Admin roles</h2>
          <AdminForm action={setUserRoles.bind(null, user.id)} submitLabel="Save roles" submitVariant="secondary">
            <div className="flex flex-wrap gap-5">
              {ROLES.map((role) => (
                <CheckField key={role.slug} label={role.label} name="roles" value={role.slug} defaultChecked={user.roles.includes(role.slug)} />
              ))}
            </div>
          </AdminForm>
        </Card>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Websites ({user.websites.length})</h2>
        <DataTable headers={["Website", "Status", "Published", "Last updated", ""]} isEmpty={user.websites.length === 0} empty="This user has no websites.">
          {user.websites.map((website) => (
            <tr key={website.id}>
              <Td><p className="font-semibold text-foreground">{website.name}</p><p className="text-xs">{website.slug}</p></Td>
              <Td><StatusBadge status={website.status} /></Td>
              <Td className="whitespace-nowrap">{formatDate(website.published_at)}</Td>
              <Td className="whitespace-nowrap">{formatDate(website.updated_at)}</Td>
              <Td className="text-right">
                {can(access, "websites.view") && <Link href={`/admin/websites/${website.id}`} className="font-semibold text-primary-hover hover:underline">View</Link>}
              </Td>
            </tr>
          ))}
        </DataTable>
      </section>
    </AdminPage>
  );
}
