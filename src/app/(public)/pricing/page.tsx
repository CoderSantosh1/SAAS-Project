import { Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, PUBLIC_CONTAINER } from "@/components/public/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listPlans } from "@/features/marketplace/queries";

export const metadata: Metadata = { title: "Pricing" };
export const dynamic = "force-dynamic";

function formatPrice(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export default async function PricingPage() {
  const plans = await listPlans();

  return (
    <div className={`${PUBLIC_CONTAINER} py-14 sm:py-20`}>
      <PageHeader
        title="Start free"
        description="Create and publish your website at no cost. Only plans available today are shown here."
      />
      <div className="mt-10 grid max-w-3xl gap-6 md:grid-cols-2">
        {plans.map((plan) => (
          <Card key={plan.slug} className="flex flex-col p-6">
            <h2 className="text-xl font-semibold">{plan.name}</h2>
            <p className="mt-3">
              <span className="font-heading text-4xl font-bold text-navy">
                {formatPrice(plan.monthly_price_paise)}
              </span>
              <span className="text-secondary-text"> / month</span>
            </p>
            <ul className="mt-5 flex-1 space-y-2.5">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                  {feature}
                </li>
              ))}
            </ul>
            <Link href="/register" className={`${buttonVariants({ size: "lg" })} mt-6 w-full`}>
              Start Building Free
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
