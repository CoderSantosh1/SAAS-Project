import type { CSSProperties } from "react";
import { getTheme } from "./registry";
import {
  sectionSchemas,
  siteDocumentSchema,
  type DesignTokens,
  type SectionType,
  type SiteDocument,
  type SitePage,
  type ThemeComponents,
} from "./types";

const RADIUS_VALUES: Record<DesignTokens["radius"], string> = {
  none: "0",
  md: "0.5rem",
  lg: "1rem",
};

const FONT_VARIABLES: Record<DesignTokens["headingFont"], string> = {
  inter: "--font-site-inter",
  sora: "--font-site-sora",
  playfair: "--font-site-playfair",
  "space-grotesk": "--font-site-space-grotesk",
  lora: "--font-site-lora",
};

export function tokensToCssVariables(tokens: DesignTokens) {
  return {
    "--site-primary": tokens.primary,
    "--site-on-primary": tokens.onPrimary,
    "--site-background": tokens.background,
    "--site-surface": tokens.surface,
    "--site-text": tokens.text,
    "--site-muted": tokens.mutedText,
    "--site-border": tokens.border,
    "--site-radius": RADIUS_VALUES[tokens.radius],
    "--site-font-heading": `var(${FONT_VARIABLES[tokens.headingFont]}), serif`,
    "--site-font-body": `var(${FONT_VARIABLES[tokens.bodyFont]}), sans-serif`,
  } as CSSProperties;
}

export function parseSiteDocument(value: unknown): SiteDocument | null {
  const result = siteDocumentSchema.safeParse(value);
  return result.success ? result.data : null;
}

// No slug means the homepage. Hidden pages behave as if they do not exist.
export function findPage(document: SiteDocument, slug?: string): SitePage | null {
  const page = slug
    ? document.pages.find((candidate) => candidate.slug === slug && !candidate.isHome)
    : (document.pages.find((candidate) => candidate.isHome) ?? document.pages[0]);
  return page?.isVisible ? page : null;
}

function isSectionType(type: string): type is SectionType {
  return Object.hasOwn(sectionSchemas, type);
}

function renderSection(
  components: ThemeComponents,
  section: SitePage["sections"][number],
  key: number,
  resolveHref: (href: string) => string,
) {
  // Stored content can name only section types this code knows, and must pass that
  // type's schema. Anything else is skipped rather than rendered.
  if (!section.isVisible || !isSectionType(section.type)) return null;

  const parsed = sectionSchemas[section.type].safeParse(section.props);
  if (!parsed.success) return null;

  const Component = components.sections[section.type] as React.ComponentType<{
    props: unknown;
    resolveHref: (href: string) => string;
  }>;
  return <Component key={key} props={parsed.data} resolveHref={resolveHref} />;
}

export function SiteRenderer({
  document,
  page,
  basePath = "",
  className,
}: {
  document: SiteDocument;
  page: SitePage;
  basePath?: string;
  className?: string;
}) {
  const theme = getTheme(document.themeId, document.themeVersion);
  if (!theme) return null;

  const { Header, Footer } = theme.components;
  const homeHref = basePath || "/";
  const resolveHref = (href: string) => {
    if (!href.startsWith("/")) return href;
    return href === "/" ? homeHref : `${basePath}${href}`;
  };

  const links = document.pages
    .filter((candidate) => candidate.isVisible)
    .map((candidate) => ({
      label: candidate.title,
      href: candidate.isHome ? homeHref : `${basePath}/${candidate.slug}`,
    }));

  return (
    <div
      style={tokensToCssVariables(document.tokens)}
      className={`site-root flex min-h-dvh flex-col ${className ?? ""}`}
    >
      <Header siteName={document.siteName} logoUrl={document.logoUrl} homeHref={homeHref} links={links} />
      <main className="flex-1">
        {/* Only hero sections render an h1, and every page needs one. */}
        {!page.sections.some((section) => section.type === "hero" && section.isVisible) && (
          <h1 className="sr-only">{page.title}</h1>
        )}
        {page.sections.map((section, index) =>
          renderSection(theme.components, section, index, resolveHref),
        )}
      </main>
      <Footer siteName={document.siteName} />
    </div>
  );
}
