import Link from "next/link";
import { ScaledFrame } from "@/components/shared/scaled-frame";
import { Card } from "@/components/ui/card";
import type { MarketplaceTemplate } from "@/features/marketplace/queries";

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
  return (
    <ScaledFrame
      src={`/preview/themes/${template.theme_slug}`}
      title={`${template.name} preview`}
      deviceWidth={1280}
      className={className}
    />
  );
}

// Without an `href` (the public site), the whole card opens the theme page. With one, the
// card goes there instead and can say so with `cta`, plus an optional separate preview link.
type CardOptions = { cta?: string; withPreviewLink?: boolean };

export function ThemeCard({ template, href, cta, withPreviewLink }: { template: MarketplaceTemplate; href?: string } & CardOptions) {
  const categories = template.category_names.slice(0, 2);
  return (
    <Card className="group relative flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
      <div className="relative overflow-hidden">
        <ThemeImage template={template} />
        {template.is_featured && (
          <span className="absolute top-3 left-3 rounded-full bg-navy/85 px-2.5 py-0.5 text-xs font-semibold text-white">Featured</span>
        )}
      </div>
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
        {categories.length > 0 && (
          <p className="mt-1 text-xs font-medium text-secondary-text">{categories.join(" · ")}</p>
        )}
        {template.description && (
          <p className="mt-2 line-clamp-3 text-sm text-secondary-text">{template.description}</p>
        )}
        {cta && (
          <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-sm font-semibold">
            <span className="text-primary-hover">{cta}</span>
            {withPreviewLink && (
              <Link href={`/themes/${template.theme_slug}`} className="relative z-10 text-secondary-text hover:text-foreground hover:underline">
                Preview
              </Link>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

export function ThemeGrid({
  templates,
  hrefFor,
  ...options
}: {
  templates: MarketplaceTemplate[];
  hrefFor?: (template: MarketplaceTemplate) => string;
} & CardOptions) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((template) => (
        <ThemeCard key={template.template_id} template={template} href={hrefFor?.(template)} {...options} />
      ))}
    </div>
  );
}
