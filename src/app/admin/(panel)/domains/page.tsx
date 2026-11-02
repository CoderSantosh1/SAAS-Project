import type { Metadata } from "next";
import { z } from "zod";
import { AdminPage, DataTable, FilterBar, formatDate, Pagination, parseOffset, StatusBadge, Td } from "@/components/admin/admin-ui";
import { DomainActions } from "@/features/admin/components/domain-actions";
import { listDomains } from "@/features/admin/panel-queries";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Domains" };

const schema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  offset: z.string().optional().catch(undefined),
});

export default async function AdminDomainsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin("domains.manage");
  const { q, offset: rawOffset } = schema.parse(await searchParams);
  const offset = parseOffset(rawOffset);
  const { custom, subdomains } = await listDomains(q, offset);

  return (
    <AdminPage title="Domains" description="Custom domain requests and web addresses on the platform.">
      <FilterBar action="/admin/domains" search={q} placeholder="Search by address" />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Custom domains ({custom.length})</h2>
        <DataTable headers={["Domain", "Website", "DNS", "SSL", "Requested", ""]} isEmpty={custom.length === 0} empty="No custom domain requests yet. Users can request one when that feature is built.">
          {custom.map((domain) => (
            <tr key={domain.id}>
              <Td>
                <p className="font-semibold text-foreground">{domain.hostname}</p>
                <p className="mt-0.5 max-w-xs text-xs break-all">TXT _web-verify.{domain.hostname} = {domain.verification_token}</p>
              </Td>
              <Td><p>{domain.website_name}</p><p className="text-xs">{domain.owner_email}</p></Td>
              <Td><StatusBadge status={domain.status} /></Td>
              <Td><StatusBadge status={domain.ssl_status} /></Td>
              <Td className="whitespace-nowrap">{formatDate(domain.created_at)}</Td>
              <Td><DomainActions id={domain.id} hostname={domain.hostname} token={domain.verification_token} status={domain.status} /></Td>
            </tr>
          ))}
        </DataTable>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Platform addresses ({subdomains.total})</h2>
        <DataTable headers={["Address", "Website", "Owner", "Status"]} isEmpty={subdomains.rows.length === 0} empty="No web addresses match.">
          {subdomains.rows.map((row) => (
            <tr key={row.id}>
              <Td className="font-semibold text-foreground">{row.slug}</Td>
              <Td>{row.name}</Td>
              <Td>{row.owner_email}</Td>
              <Td><StatusBadge status={row.status} /></Td>
            </tr>
          ))}
        </DataTable>
        <Pagination path="/admin/domains" params={{ q }} offset={offset} total={subdomains.total} />
      </section>
    </AdminPage>
  );
}
