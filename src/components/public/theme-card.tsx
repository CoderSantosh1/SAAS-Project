import { LayoutTemplate } from "lucide-react";
import Link from "next/link";
import { ScaledFrame } from "@/components/shared/scaled-frame";
import { Card } from "@/components/ui/card";
import type { MarketplaceTemplate } from "@/features/marketplace/queries";
import { getThemeDefinitionBySlug } from "@/themes/registry";

function ThemeImage({ template }: { template: MarketplaceTemplate }) {
  const className = "aspect-[4/3] w-full border-b border-border";

  if (template.thumbnail_url) {
    return (
      // Admins can host thumbnails on any storage domain.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={template.thumbnail_url}
        alt=""
        loading="lazy"
        className={`${className} object-cover object-top`}
      />
    );
  }

  // Without an uploaded thumbnail, show the real theme.
  if (getThemeDefinitionBySlug(template.theme_slug)) {
    return (
      <ScaledFrame
        src={`/preview/themes/${template.theme_slug}`}
        title={`${template.name} preview`}
        deviceWidth={1280}
        className={className}
      />
    );
  }

  return (
    <div className={`${className} flex items-center justify-center bg-primary-light text-primary`}>
      <LayoutTemplate className="size-10" aria-hidden />
    </div>
  );
}

export function ThemeCard({ template, href }: { template: MarketplaceTemplate; href?: string }) {
  return (
    <Card className="group relative flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
      <ThemeImage template={template} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">
            <Link href={href ?? `/themes/${template.theme_slug}`} className="after:absolute after:inset-0">
              {template.name}
            </Link>
          </h3>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              template.is_premium ? "bg-warning/15 text-amber-800" : "bg-primary-light text-primary-hover"
            }`}
          >
            {template.is_premium ? "Premium" : "Free"}
          </span>
        </div>
        {template.description && (
          <p className="mt-2 text-sm text-secondary-text">{template.description}</p>
        )}
      </div>
    </Card>
  );
}

export function ThemeGrid({
  templates,
  hrefFor,
}: {
  templates: MarketplaceTemplate[];
  hrefFor?: (template: MarketplaceTemplate) => string;
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((template) => (
        <ThemeCard key={template.template_id} template={template} href={hrefFor?.(template)} />
      ))}
    </div>
  );
}
