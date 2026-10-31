import { ArrowLeft, Check, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { PUBLIC_CONTAINER } from "@/components/public/page-header";
import { ThemePreview } from "@/components/public/theme-preview";
import { buttonVariants } from "@/components/ui/button";
import { getTheme } from "@/features/marketplace/queries";
import { getThemeDefinitionBySlug } from "@/themes/registry";

const loadTheme = cache(getTheme);

type Props = { params: Promise<{ slug: string }> };

const FEATURE_LABELS: Record<string, string> = {
  "multi-page": "Multiple pages",
  responsive: "Works on every device",
  "contact-details": "Contact details section",
  testimonials: "Testimonials",
  gallery: "Image gallery",
  menu: "Menu and price list",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const theme = await loadTheme((await params).slug);
  return theme
    ? { title: `${theme.name} theme`, description: theme.description ?? undefined }
    : { title: "Theme not found" };
}

export default async function ThemePage({ params }: Props) {
  const { slug } = await params;
  const theme = await loadTheme(slug);
  if (!theme) notFound();

  const previewSrc = getThemeDefinitionBySlug(theme.slug) ? `/preview/themes/${theme.slug}` : null;

  return (
    <div className={`${PUBLIC_CONTAINER} py-10 sm:py-14`}>
      <Link href="/templates" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-secondary-text hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        All templates
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold sm:text-4xl">{theme.name}</h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                theme.is_premium ? "bg-warning/15 text-amber-800" : "bg-primary-light text-primary-hover"
              }`}
            >
              {theme.is_premium ? "Premium" : "Free"}
            </span>
          </div>
          {theme.description && <p className="mt-3 text-lg text-secondary-text">{theme.description}</p>}
        </div>
        <div className="flex flex-wrap gap-3">
          {previewSrc && (
            <a href={previewSrc} target="_blank" rel="noopener" className={buttonVariants({ variant: "secondary", size: "lg" })}>
              Full preview
              <ExternalLink className="size-4" aria-hidden />
            </a>
          )}
          <Link href={`/dashboard/create-website?theme=${theme.slug}`} className={buttonVariants({ size: "lg" })}>
            Use This Theme
          </Link>
        </div>
      </div>

      {previewSrc && (
        <div className="mt-10">
          <ThemePreview src={previewSrc} title={theme.name} />
        </div>
      )}

      <div className="mt-12 grid gap-10 md:grid-cols-2">
        {theme.supported_features.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold">What is included</h2>
            <ul className="mt-4 space-y-2.5">
              {theme.supported_features.map((feature) => (
                <li key={feature} className="flex gap-2 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                  {FEATURE_LABELS[feature] ?? feature}
                </li>
              ))}
            </ul>
          </div>
        )}
        {theme.categories.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold">Great for</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {theme.categories.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/categories/${category.slug}`}
                    className="block rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
