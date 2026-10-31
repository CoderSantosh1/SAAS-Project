import { Blocks, LayoutTemplate, Rocket } from "lucide-react";
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
      <section className="bg-surface">
        <div className={`${PUBLIC_CONTAINER} flex flex-col items-center py-20 text-center sm:py-28`}>
          <h1 className="max-w-3xl text-4xl font-bold sm:text-6xl">{brand.tagline}</h1>
          <p className="mt-5 max-w-xl text-lg text-secondary-text">
            Build your website without coding. Choose a theme, make it yours and publish it in minutes.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register" className={buttonVariants({ size: "lg" })}>
              Start Building Free
            </Link>
            <Link href="/templates" className={buttonVariants({ variant: "secondary", size: "lg" })}>
              Explore Templates
            </Link>
          </div>
        </div>
      </section>

      <section className={`${PUBLIC_CONTAINER} py-16 sm:py-20`}>
        <h2 className="text-2xl font-semibold sm:text-3xl">How it works</h2>
        <ol className="mt-8 grid gap-8 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <span className="flex size-11 items-center justify-center rounded-md bg-primary-light text-primary">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-1 text-secondary-text">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {templates.length > 0 && (
        <section className="bg-surface py-16 sm:py-20">
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

      <section className="bg-navy py-16 text-center text-white">
        <div className={PUBLIC_CONTAINER}>
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">Your website starts here</h2>
          <p className="mt-3 text-white/70">Free to start, with no code to write.</p>
          <Link href="/register" className={`${buttonVariants({ size: "lg" })} mt-7`}>
            Start Building Free
          </Link>
        </div>
      </section>
    </>
  );
}
