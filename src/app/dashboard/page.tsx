import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle } from "@/components/user/page-title";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getUserDashboardData } from "@/features/websites/queries";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Dashboard" };

const ONBOARDING = [
  { title: "Choose a template", text: "Pick a design made for your kind of business." },
  { title: "Add your details", text: "Your name, colors and contact details go in automatically." },
  { title: "Preview your draft", text: "See how it looks. It stays private until you publish." },
];

export default async function DashboardPage() {
  const profile = await requireUser();
  const data = await getUserDashboardData(profile.id);
  const firstName = profile.full_name?.split(" ")[0];

  const stats = [
    { label: "Total websites", value: data.total },
    { label: "Published", value: data.published },
    { label: "Drafts", value: data.draft },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageTitle
        title={firstName ? `Welcome, ${firstName}` : "Welcome"}
        description={data.total === 0 ? "Let us get your first website started." : "Here is how your websites are doing."}
        action={
          <Link href="/dashboard/create-website" className={buttonVariants()}>
            <Plus className="size-4" aria-hidden />
            Create Website
          </Link>
        }
      />

      {data.total === 0 ? (
        <Card className="p-6">
          <h2 className="text-lg font-semibold">Getting started</h2>
          <ol className="mt-4 grid gap-5 sm:grid-cols-3">
            {ONBOARDING.map((step, index) => (
              <li key={step.title}>
                <span className="flex size-8 items-center justify-center rounded-full bg-primary-light text-sm font-semibold text-primary">
                  {index + 1}
                </span>
                <h3 className="mt-3 font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-secondary-text">{step.text}</p>
              </li>
            ))}
          </ol>
          <Link href="/dashboard/create-website" className={`${buttonVariants({ size: "lg" })} mt-6`}>
            Create your first website
          </Link>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <Card key={stat.label} className="p-5">
                <p className="text-sm text-secondary-text">{stat.label}</p>
                <p className="mt-1 font-heading text-3xl font-semibold text-navy">{stat.value}</p>
              </Card>
            ))}
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Recently edited</h2>
              <Link href="/dashboard/websites" className="text-sm font-semibold text-primary hover:text-primary-hover">
                View all
              </Link>
            </div>
            <ul className="mt-3 divide-y divide-border">
              {data.recent.map((website) => (
                <li key={website.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <Link href={`/editor/${website.id}`} className="truncate font-medium hover:text-primary">
                    {website.name}
                  </Link>
                  <span className="shrink-0 text-secondary-text capitalize">{website.status}</span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}
