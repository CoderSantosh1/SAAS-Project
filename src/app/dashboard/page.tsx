import { FileText, Globe, Image as ImageIcon, MousePointerClick, Pencil, Plus, Rocket, Sparkles, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ScaledFrame } from "@/components/shared/scaled-frame";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getUserDashboardData } from "@/features/websites/queries";
import { requireUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

const ONBOARDING = [
  { title: "Choose a template", text: "Pick a design made for your kind of business." },
  { title: "Add your details", text: "Your name, colors and contact details go in automatically." },
  { title: "Click and type", text: "Change any text right on the page. It stays private until you publish." },
];

const SHORTCUTS: { label: string; text: string; href: string; icon: LucideIcon }[] = [
  { label: "Create a website", text: "Start from a template", href: "/dashboard/create-website", icon: Plus },
  { label: "Browse templates", text: "Designs for every business", href: "/dashboard/templates", icon: Sparkles },
  { label: "Media library", text: "Your photos and logos", href: "/dashboard/media", icon: ImageIcon },
];

export default async function DashboardPage() {
  const profile = await requireUser();
  const data = await getUserDashboardData(profile.id);
  const firstName = profile.full_name?.split(" ")[0];

  const stats: { label: string; value: number; icon: LucideIcon; tone: string }[] = [
    { label: "Total websites", value: data.total, icon: Globe, tone: "bg-primary-light text-primary" },
    { label: "Published", value: data.published, icon: Rocket, tone: "bg-success/10 text-green-700" },
    { label: "Drafts", value: data.draft, icon: FileText, tone: "bg-warning/15 text-amber-700" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary-hover to-brand-blue p-6 text-white shadow-card sm:p-8">
        <div className="pointer-events-none absolute -top-16 -right-10 size-64 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 size-72 rounded-full bg-accent/30 blur-3xl" aria-hidden />
        <div className="relative max-w-xl">
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">{firstName ? `Welcome back, ${firstName}` : "Welcome"}</h1>
          <p className="mt-2 text-white/80">
            {data.total === 0
              ? "Let us get your first website started. It takes a few minutes."
              : `You have ${data.total} website${data.total === 1 ? "" : "s"}. Pick up where you left off.`}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/dashboard/create-website" className={cn(buttonVariants(), "bg-white text-primary hover:bg-white/90")}>
              <Plus className="size-4" aria-hidden />
              Create Website
            </Link>
            {data.recent[0] && (
              <Link href={`/editor/${data.recent[0].id}`} className={cn(buttonVariants({ variant: "ghost" }), "text-white hover:bg-white/15 hover:text-white")}>
                <Pencil className="size-4" aria-hidden />
                Continue editing {data.recent[0].name}
              </Link>
            )}
          </div>
        </div>
      </section>

      {data.total === 0 ? (
        <Card className="p-6">
          <h2 className="text-lg font-semibold">Getting started</h2>
          <ol className="mt-4 grid gap-5 sm:grid-cols-3">
            {ONBOARDING.map((step, index) => (
              <li key={step.title} className="rounded-xl border border-border p-4">
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
            {stats.map(({ label, value, icon: Icon, tone }) => (
              <Card key={label} className="flex items-center gap-4 p-5">
                <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", tone)}>
                  <Icon className="size-5" aria-hidden />
                </span>
                <span>
                  <span className="block text-sm text-secondary-text">{label}</span>
                  <span className="block font-heading text-3xl font-semibold text-navy">{value}</span>
                </span>
              </Card>
            ))}
          </div>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Recently edited</h2>
              <Link href="/dashboard/websites" className="text-sm font-semibold text-primary hover:text-primary-hover">
                View all
              </Link>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.recent.map((website) => (
                <li key={website.id}>
                  <Link href={`/editor/${website.id}`} className="group block overflow-hidden rounded-xl border border-border bg-surface shadow-card transition hover:-translate-y-0.5 hover:border-accent">
                    <div className="relative">
                      <ScaledFrame src={`/preview/sites/${website.id}`} title={`${website.name} preview`} deviceWidth={1280} className="aspect-[16/10] w-full" />
                      <span className="absolute inset-0 flex items-center justify-center bg-navy/0 opacity-0 transition group-hover:bg-navy/40 group-hover:opacity-100">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-navy">
                          <Pencil className="size-4" aria-hidden />
                          Edit site
                        </span>
                      </span>
                    </div>
                    <span className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm">
                      <span className="truncate font-medium">{website.name}</span>
                      <span className="shrink-0 rounded-full bg-background px-2.5 py-0.5 text-xs font-semibold text-secondary-text capitalize">{website.status}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="grid gap-4 sm:grid-cols-3">
          {SHORTCUTS.map(({ label, text, href, icon: Icon }) => (
            <Link key={href} href={href} className="group rounded-xl border border-border bg-surface p-4 transition hover:border-accent hover:shadow-card">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary-light text-primary transition group-hover:bg-primary group-hover:text-white">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="mt-3 block font-semibold">{label}</span>
              <span className="mt-0.5 block text-sm text-secondary-text">{text}</span>
            </Link>
          ))}
        </div>
        <Card className="flex gap-3 p-4">
          <MousePointerClick className="size-5 shrink-0 text-primary" aria-hidden />
          <div className="text-sm">
            <p className="font-semibold">Tip: edit right on the page</p>
            <p className="mt-1 text-secondary-text">
              In the editor, click any heading, paragraph or button text and type. Press Enter to keep it, or Esc to undo.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
