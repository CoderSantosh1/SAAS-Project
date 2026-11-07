import { ArrowRight, Blocks, LayoutTemplate, MousePointerClick, Rocket, Sparkles } from "lucide-react";
import Link from "next/link";
import { CategoryGrid } from "@/components/public/category-grid";
import { PUBLIC_CONTAINER } from "@/components/public/page-header";
import { ThemeGrid } from "@/components/public/theme-card";
import { buttonVariants } from "@/components/ui/button";
import { brand } from "@/config/brand";
import { listCategories, listTemplates } from "@/features/marketplace/queries";

export const dynamic = "force-dynamic";

const STEPS = [
  { icon: LayoutTemplate, title: "Choose a theme", text: "Start from a professionally designed theme for your kind of business." },
  { icon: Blocks, title: "Customize every section", text: "Change text, images and colors, with no code to write." },
  { icon: Rocket, title: "Publish in minutes", text: "Put your website live and manage it all from one dashboard." },
];

// The homepage must stay up during a database problem, so it drops these sections
// rather than failing.
async function loadMarketplacePreview() {
  try {
    const [templates, categories] = await Promise.all([
      listTemplates({ featuredOnly: true, limit: 3 }),
      listCategories(),
    ]);
    const withTemplates = categories.filter((category) => Number(category.template_count) > 0);
    return { templates, categories: withTemplates.slice(0, 8) };
  } catch (error) {
    console.error(error);
    return { templates: [], categories: [] };
  }
}

export default async function HomePage() {
  const { templates, categories } = await loadMarketplacePreview();

  return (
    <>
      <section className="relative overflow-hidden">
        <div className={`${PUBLIC_CONTAINER} grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-[1.1fr_1fr]`}>
          <div className="text-center lg:text-left">
            <p className="glass inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm font-medium text-primary-hover shadow-card">
              <Sparkles className="size-4" aria-hidden />
              50+ templates for every kind of business
            </p>
            <h1 className="text-gradient mt-6 text-4xl leading-[1.05] font-bold tracking-tight sm:text-6xl">{brand.tagline}</h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-secondary-text lg:mx-0">
              Build your website without coding. Choose a theme, make it yours and publish it in minutes.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Link href="/register" className={`${buttonVariants({ size: "lg" })} rounded-full px-7`}>
                Start Building Free
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link href="/templates" className={`${buttonVariants({ variant: "secondary", size: "lg" })} rounded-full px-7`}>
                Explore Templates
              </Link>
            </div>
          </div>

          {/* A decorative glass mock-up of the editor. */}
          <div className="relative mx-auto w-full max-w-lg" aria-hidden>
            <div className="absolute -top-10 -right-6 size-48 rounded-full bg-brand-blue/30 blur-3xl" />
            <div className="absolute -bottom-10 -left-6 size-48 rounded-full bg-primary/30 blur-3xl" />
            <div className="glass relative rounded-3xl border border-border bg-surface p-3 shadow-elevated">
              <div className="flex items-center gap-1.5 px-2 pb-3">
                <span className="size-2.5 rounded-full bg-red-300" />
                <span className="size-2.5 rounded-full bg-amber-300" />
                <span className="size-2.5 rounded-full bg-emerald-300" />
                <span className="ml-3 h-5 flex-1 rounded-full bg-white/70" />
              </div>
              <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-[#6a6ff7] to-brand-blue p-6 text-white">
                <div className="h-2.5 w-24 rounded-full bg-white/60" />
                <div className="mt-5 h-6 w-4/5 rounded-full bg-white/90" />
                <div className="mt-2.5 h-6 w-3/5 rounded-full bg-white/90" />
                <div className="mt-5 flex gap-2">
                  <div className="h-8 w-28 rounded-full bg-white" />
                  <div className="h-8 w-24 rounded-full border border-white/70" />
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {["bg-primary/15", "bg-brand-blue/15", "bg-emerald-300/30"].map((tone) => (
                  <div key={tone} className="rounded-xl bg-white/70 p-3">
                    <div className={`size-7 rounded-lg ${tone}`} />
                    <div className="mt-3 h-2 w-full rounded-full bg-navy/10" />
                    <div className="mt-1.5 h-2 w-2/3 rounded-full bg-navy/10" />
                  </div>
                ))}
              </div>
            </div>
            <div className="glass absolute -bottom-6 -left-4 flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-navy shadow-elevated sm:-left-10">
              <MousePointerClick className="size-4 text-primary" />
              Click any text to edit
            </div>
            <div className="glass absolute -top-5 -right-3 rounded-2xl border border-border bg-surface px-4 py-3 text-sm shadow-elevated sm:-right-8">
              <span className="block text-xs text-secondary-text">Published</span>
              <span className="font-semibold text-navy">in 4 minutes</span>
            </div>
          </div>
        </div>
      </section>

      <section className={`${PUBLIC_CONTAINER} py-16 sm:py-20`}>
        <h2 className="text-2xl font-semibold sm:text-3xl">How it works</h2>
        <ol className="mt-8 grid gap-5 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }, index) => (
            <li key={title} className="glass relative rounded-2xl border border-border bg-surface p-6 shadow-card">
              <span className="absolute top-5 right-6 font-heading text-4xl font-bold text-primary/15" aria-hidden>
                0{index + 1}
              </span>
              <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-brand-blue text-white shadow-lg shadow-primary/30">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-1 text-secondary-text">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {templates.length > 0 && (
        <section className="py-16 sm:py-20">
          <div className={PUBLIC_CONTAINER}>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-2xl font-semibold sm:text-3xl">Featured themes</h2>
              <Link href="/templates" className="text-sm font-semibold text-primary hover:text-primary-hover">
                View all templates
              </Link>
            </div>
            <ThemeGrid templates={templates} />
          </div>
        </section>
      )}

      {categories.length > 0 && (
        <section className={`${PUBLIC_CONTAINER} py-16 sm:py-20`}>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-2xl font-semibold sm:text-3xl">Browse by category</h2>
            <Link href="/categories" className="text-sm font-semibold text-primary hover:text-primary-hover">
              All categories
            </Link>
          </div>
          <CategoryGrid categories={categories} />
        </section>
      )}

      <section className={`${PUBLIC_CONTAINER} pb-20`}>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-[#6a6ff7] to-brand-blue px-6 py-14 text-center text-white shadow-elevated sm:px-12">
          <div className="pointer-events-none absolute -top-20 -left-16 size-64 rounded-full bg-white/20 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -right-16 -bottom-24 size-72 rounded-full bg-accent/40 blur-3xl" aria-hidden />
          <h2 className="relative text-2xl font-semibold text-white sm:text-4xl">Your website starts here</h2>
          <p className="relative mt-3 text-white/80">Free to start, with no code to write.</p>
          <Link href="/register" className="relative mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-sm font-semibold text-primary-hover shadow-lg transition hover:bg-white/90">
            Start Building Free
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>
    </>
  );
}
