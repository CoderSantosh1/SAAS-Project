import { Check, Clock, CreditCard, Globe, HardDrive, Receipt, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { formatDate, StatusBadge } from "@/components/admin/admin-ui";
import { PageTitle } from "@/components/user/page-title";
import { Card } from "@/components/ui/card";
import { RequestPlanButton } from "@/features/billing/components/request-plan-button";
import { formatBytes, formatRupees, limitLabel, usagePercent } from "@/features/billing/format";
import { getMyBilling } from "@/features/billing/queries";
import { requireUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Billing" };

function Meter({ label, used, limit, icon: Icon }: { label: string; used: string; limit: string; icon: typeof Globe }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="flex items-center gap-2 font-medium text-foreground">
        <Icon className="size-4 text-primary" aria-hidden />
        {label}
      </span>
      <span className="text-secondary-text tabular-nums">
        {used} of {limit}
      </span>
    </div>
  );
}

export default async function BillingPage() {
  await requireUser();
  const billing = await getMyBilling();
  const { plan, usage } = billing;
  const storageLimitBytes = plan.storage_limit_mb ? plan.storage_limit_mb * 1024 * 1024 : null;
  const meters = [
    { label: "Websites", icon: Globe, used: String(usage.websites), limit: limitLabel(plan.website_limit, "websites"), percent: usagePercent(usage.websites, plan.website_limit) },
    { label: "Storage", icon: HardDrive, used: formatBytes(usage.storage_bytes), limit: plan.storage_limit_mb ? formatBytes(storageLimitBytes!) : "Unlimited", percent: usagePercent(usage.storage_bytes, storageLimitBytes) },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageTitle title="Billing" description="Your plan, what you are using and the plans available." />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Card className="relative overflow-hidden p-6">
          <div className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-primary/15 blur-3xl" aria-hidden />
          <p className="text-sm font-medium text-secondary-text">Current plan</p>
          <div className="mt-1 flex flex-wrap items-baseline gap-3">
            <h2 className="text-3xl font-semibold">{plan.name}</h2>
            <span className="text-lg text-secondary-text">
              {formatRupees(plan.monthly_price_paise)}
              {plan.monthly_price_paise > 0 && <span className="text-sm"> / month</span>}
            </span>
          </div>
          {billing.subscription?.current_period_end ? (
            <p className="mt-2 text-sm text-secondary-text">Active until {formatDate(billing.subscription.current_period_end)}</p>
          ) : (
            <p className="mt-2 text-sm text-secondary-text">No end date. Free forever.</p>
          )}
          <ul className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-green-600" aria-hidden />
                {feature}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="space-y-5 p-6">
          <h2 className="text-lg font-semibold">Usage</h2>
          {meters.map((meter) => (
            <div key={meter.label} className="space-y-2">
              <Meter label={meter.label} used={meter.used} limit={meter.limit} icon={meter.icon} />
              {meter.percent !== null && (
                <div className="h-2 overflow-hidden rounded-full bg-background" role="progressbar" aria-label={`${meter.label} used`} aria-valuenow={meter.percent} aria-valuemin={0} aria-valuemax={100}>
                  <div className={cn("h-full rounded-full", meter.percent >= 90 ? "bg-danger" : meter.percent >= 70 ? "bg-warning" : "bg-primary")} style={{ width: `${Math.max(3, meter.percent)}%` }} />
                </div>
              )}
            </div>
          ))}
          <p className="text-sm text-secondary-text">
            {usage.published} of {usage.websites} {usage.websites === 1 ? "website is" : "websites are"} live.
          </p>
        </Card>
      </div>

      {billing.pending_request && (
        <Card className="flex items-center gap-3 border-primary/25 bg-primary-light p-4 text-sm">
          <Clock className="size-5 shrink-0 text-primary" aria-hidden />
          <p>
            <span className="font-semibold">{billing.pending_request.replace("Plan request: ", "")} plan requested.</span> Our team will contact you soon. You can follow it in{" "}
            <Link href="/dashboard/support" className="font-semibold text-primary-hover underline">
              Help and Support
            </Link>
            .
          </p>
        </Card>
      )}

      <section aria-labelledby="plans-heading" className="space-y-4">
        <div>
          <h2 id="plans-heading" className="text-lg font-semibold">
            Plans
          </h2>
          <p className="text-sm text-secondary-text">Pick a plan and our team will contact you about payment and switch your account.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {billing.plans.map((option) => {
            const price = formatRupees(option.monthly_price_paise);
            return (
              <Card key={option.slug} className={cn("flex flex-col p-5", option.is_current && "border-primary/50 ring-2 ring-primary/20")}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold">{option.name}</h3>
                  {option.is_current ? (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-white">Current</span>
                  ) : (
                    option.slug === "professional" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary-light px-2 py-0.5 text-[11px] font-semibold text-primary-hover">
                        <Sparkles className="size-3" aria-hidden />
                        Popular
                      </span>
                    )
                  )}
                </div>
                <p className="mt-2 font-heading text-2xl font-semibold text-navy">
                  {price}
                  {option.monthly_price_paise > 0 && <span className="text-sm font-normal text-secondary-text"> / month</span>}
                </p>
                <ul className="mt-4 flex-1 space-y-1.5 text-sm text-secondary-text">
                  <li>{limitLabel(option.website_limit, "websites")}</li>
                  <li>{option.storage_limit_mb ? `${formatBytes(option.storage_limit_mb * 1024 * 1024)} storage` : "Unlimited storage"}</li>
                  <li>{option.custom_domains ? "Custom domains" : "Free subdomain"}</li>
                  <li>{option.premium_themes ? "Premium themes" : "Free themes"}</li>
                  {option.features.slice(0, 3).map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <div className="mt-5">
                  {option.is_current ? (
                    <p className="rounded-md bg-background px-3 py-2 text-center text-sm font-medium text-secondary-text">Your plan</p>
                  ) : (
                    <RequestPlanButton slug={option.slug} name={option.name} price={price} primary={option.slug === "professional"} />
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <Card className="p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Receipt className="size-5 text-primary" aria-hidden />
          Payment history
        </h2>
        {billing.payments.length === 0 ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-secondary-text">
            <CreditCard className="size-4" aria-hidden />
            No payments yet.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {billing.payments.map((payment) => (
              <li key={payment.created_at} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span>{formatDate(payment.created_at)}</span>
                <span className="flex items-center gap-3">
                  <span className="font-medium tabular-nums">{formatRupees(payment.amount_paise)}</span>
                  <StatusBadge status={payment.status} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
