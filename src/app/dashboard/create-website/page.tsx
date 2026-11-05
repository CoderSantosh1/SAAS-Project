import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { CategoryGrid } from "@/components/public/category-grid";
import { paginate, Pagination } from "@/components/public/template-browse";
import { ThemeGrid } from "@/components/public/theme-card";
import { ThemePreview } from "@/components/public/theme-preview";
import { PageTitle } from "@/components/user/page-title";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getTheme, listCategories, listTemplates } from "@/features/marketplace/queries";
import { CreateWebsiteForm } from "@/features/websites/components/create-website-form";
import { requireUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Create Website" };

const STEPS = ["Category", "Template", "Preview", "Details"];

const slugParam = z.string().regex(/^[a-z0-9-]+$/).max(80).optional().catch(undefined);
const paramsSchema = z.object({
  category: slugParam,
  theme: slugParam,
  step: z.enum(["details"]).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(100).optional().catch(undefined),
});

function StepIndicator({ current }: { current: number }) {
  return (
    <ol className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
      {STEPS.map((step, index) => (
        <li
          key={step}
          aria-current={index === current ? "step" : undefined}
          className={cn(
            "flex items-center gap-2 font-medium",
            index === current ? "text-primary" : index < current ? "text-foreground" : "text-muted-text",
          )}
        >
          <span
            className={cn(
              "flex size-6 items-center justify-center rounded-full text-xs",
              index === current ? "bg-primary text-white" : "bg-surface border border-border",
            )}
          >
            {index + 1}
          </span>
          {step}
        </li>
      ))}
    </ol>
  );
}

function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary-text hover:text-foreground">
      <ArrowLeft className="size-4" aria-hidden />
      {label}
    </Link>
  );
}

function withParams(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return `/dashboard/create-website${query ? `?${query}` : ""}`;
}

// Each step is its own URL, so the back button and links into the wizard both work.
export default async function CreateWebsitePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireUser();
  const { category, theme: themeSlug, step, page } = paramsSchema.parse(await searchParams);

  if (!themeSlug && !category) {
    const categories = await listCategories();
    const withTemplates = categories.filter((option) => Number(option.template_count) > 0);
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <StepIndicator current={0} />
        <PageTitle title="What is your website for?" description="Choose the closest match. You can change everything later." />
        <CategoryGrid
          categories={withTemplates}
          hrefFor={(option) => withParams({ category: option.slug })}
        />
        <Link href={withParams({ category: "all" })} className="inline-block text-sm font-semibold text-primary hover:text-primary-hover">
          See all templates
        </Link>
      </div>
    );
  }

  if (!themeSlug) {
    const templates = await listTemplates({ categorySlug: category === "all" ? undefined : category });
    const current = paginate(templates, page ?? 1);
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <StepIndicator current={1} />
        <BackLink href={withParams({})} label="Change category" />
        <PageTitle title="Choose a template" description="Pick the design closest to what you have in mind." />
        {templates.length > 0 ? (
          <>
            <ThemeGrid
              templates={current.items}
              hrefFor={(template) => withParams({ category, theme: template.theme_slug })}
              cta="Preview and choose"
            />
            <Pagination
              basePath="/dashboard/create-website"
              filters={{ category }}
              page={current.page}
              pageCount={current.pageCount}
            />
          </>
        ) : (
          <Card className="p-10 text-center text-sm text-secondary-text">
            There are no templates in this category yet.
          </Card>
        )}
      </div>
    );
  }

  const theme = await getTheme(themeSlug);
  if (!theme) notFound();

  const categorySlug = category && category !== "all" ? category : undefined;

  if (step !== "details") {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <StepIndicator current={2} />
        <BackLink href={withParams({ category: category ?? "all" })} label="Back to templates" />
        <PageTitle
          title={theme.name}
          description={theme.description ?? undefined}
          action={
            <Link href={withParams({ category, theme: themeSlug, step: "details" })} className={buttonVariants({ size: "lg" })}>
              Use this template
            </Link>
          }
        />
        <ThemePreview src={`/preview/themes/${themeSlug}`} title={theme.name} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <StepIndicator current={3} />
      <BackLink href={withParams({ category, theme: themeSlug })} label="Back to preview" />
      <PageTitle title="Tell us about your website" description={`Using the ${theme.name} template.`} />
      <Card className="p-6">
        <CreateWebsiteForm
          themeSlug={themeSlug}
          categorySlug={categorySlug}
          defaultColor={theme.primary_color ?? "#7667F5"}
          categories={theme.categories}
        />
      </Card>
    </div>
  );
}
