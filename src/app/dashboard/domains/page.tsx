import { CheckCircle2, Clock, Globe, Link2, ShieldCheck, XCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/admin/admin-ui";
import { EmptyState } from "@/components/shared/empty-state";
import { PageTitle } from "@/components/user/page-title";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AddDomainForm, CopyValue, RemoveDomainButton } from "@/features/domains/components/domain-forms";
import { dnsRecords } from "@/features/domains/hostnames";
import { listMyDomains } from "@/features/domains/queries";
import { liveSitePath } from "@/features/websites/urls";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Domains" };

const STATUS_HELP: Record<string, { icon: typeof Clock; text: string }> = {
  pending: { icon: Clock, text: "Add both DNS records at your domain provider. Our team verifies new domains within one working day." },
  verified: { icon: CheckCircle2, text: "Connected. Visitors can reach your website at this domain." },
  failed: { icon: XCircle, text: "We could not verify this domain. Check both DNS records, then contact support." },
  suspended: { icon: XCircle, text: "This domain is suspended. Contact support for help." },
};

export default async function DomainsPage() {
  const profile = await requireUser();
  const websites = await listMyDomains(profile.id);
  const domainCount = websites.reduce((total, website) => total + website.website_domains.length, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageTitle title="Domains" description="Every website gets a free address. Connect your own domain to make it yours." />

      {websites.length === 0 ? (
        <Card>
          <EmptyState
            icon={Globe}
            title="Create a website first"
            text="Once you have a website, you can connect your own domain to it here."
            action={
              <Link href="/dashboard/create-website" className={buttonVariants()}>
                Create a website
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          <Card className="p-6">
            <h2 className="text-lg font-semibold">Connect a domain</h2>
            <p className="mt-1 mb-5 text-sm text-secondary-text">Use a domain you have bought from a provider such as GoDaddy, Hostinger or BigRock. Up to 3 domains per website.</p>
            <AddDomainForm websites={websites.map(({ id, name }) => ({ id, name }))} />
          </Card>

          <section className="space-y-4" aria-labelledby="websites-heading">
            <h2 id="websites-heading" className="text-lg font-semibold">
              Your websites
            </h2>
            {websites.map((website) => (
              <Card key={website.id} className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{website.name}</p>
                    <p className="flex items-center gap-1.5 text-sm text-secondary-text">
                      <Link2 className="size-3.5" aria-hidden />
                      Free address: <span className="font-medium text-foreground">{liveSitePath(website.slug)}</span>
                    </p>
                  </div>
                  <StatusBadge status={website.status} />
                </div>

                {website.website_domains.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-secondary-text">No custom domain yet.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {website.website_domains.map((domain) => {
                      const help = STATUS_HELP[domain.status] ?? STATUS_HELP.pending!;
                      return (
                        <li key={domain.id} className="space-y-4 px-5 py-5">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                                <ShieldCheck className="size-5" aria-hidden />
                              </span>
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-foreground">{domain.hostname}</p>
                                <p className="flex items-center gap-1.5 text-sm text-secondary-text">
                                  <help.icon className="size-3.5 shrink-0" aria-hidden />
                                  {help.text}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={domain.status} />
                              <RemoveDomainButton id={domain.id} hostname={domain.hostname} />
                            </div>
                          </div>

                          {domain.status !== "verified" && (
                            <div className="overflow-x-auto rounded-lg border border-border">
                              <table className="w-full min-w-[560px] text-left text-sm">
                                <caption className="sr-only">DNS records for {domain.hostname}</caption>
                                <thead className="bg-background/70 text-[11px] font-semibold tracking-wider text-secondary-text uppercase">
                                  <tr>
                                    <th scope="col" className="px-3 py-2">Type</th>
                                    <th scope="col" className="px-3 py-2">Name</th>
                                    <th scope="col" className="px-3 py-2">Value</th>
                                    <th scope="col" className="px-3 py-2">Why</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                  {dnsRecords(domain.hostname, domain.verification_token).map((record) => (
                                    <tr key={record.type}>
                                      <td className="px-3 py-2.5 font-semibold">{record.type}</td>
                                      <td className="px-3 py-2.5 font-mono text-xs break-all">{record.name}</td>
                                      <td className="px-3 py-2.5">
                                        <span className="flex items-center justify-between gap-2">
                                          <span className="font-mono text-xs break-all">{record.value}</span>
                                          <CopyValue value={record.value} label={`${record.type} value`} />
                                        </span>
                                      </td>
                                      <td className="px-3 py-2.5 text-secondary-text">{record.purpose}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            ))}
          </section>

          <p className="text-sm text-secondary-text">
            {domainCount === 0 ? "No custom domains connected yet." : `${domainCount} custom ${domainCount === 1 ? "domain" : "domains"} across your websites.`} DNS changes can take up to 24 hours to spread.
          </p>
        </>
      )}
    </div>
  );
}
