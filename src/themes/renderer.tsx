import { Fragment, type CSSProperties, type ReactNode } from "react";
import { getTheme } from "./registry";
import { getSectionDefinition } from "./sections";
import {
  sectionDesignSchema,
  siteDocumentSchema,
  type DesignTokens,
  type RegisteredTheme,
  type SectionDesign,
  type SiteDocument,
  type SitePage,
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
  cormorant: "--font-site-cormorant",
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

// The attributes and style every site root carries, shared by the renderer and the editor.
export function themeRootProps(theme: RegisteredTheme, tokens: DesignTokens) {
  return {
    style: { ...theme.components.rootVariables, ...tokensToCssVariables(tokens) } as CSSProperties,
    "data-theme": theme.definition.componentId,
    "data-theme-family": theme.components.family ?? theme.definition.componentId,
  };
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

function designStyle(design: SectionDesign) {
  const style: Record<string, string> = {};
  if (design.backgroundColor) {
    style.background = design.backgroundColor;
    style["--site-background"] = design.backgroundColor;
    style["--site-surface"] = design.backgroundColor;
  }
  if (design.textColor) {
    style.color = design.textColor;
    style["--site-text"] = design.textColor;
    style["--site-muted"] = design.textColor;
  }
  return style as CSSProperties;
}

// Stored content can name only section types this code knows, and must pass that
// type's schema. Anything else returns null rather than being rendered.
export function renderSectionContent(
  theme: RegisteredTheme,
  section: { type: string; props: unknown; design?: unknown },
  resolveHref: (href: string) => string,
): ReactNode {
  const definition = getSectionDefinition(theme, section.type);
  if (!definition) return null;

  const parsed = definition.schema.safeParse(section.props);
  if (!parsed.success) return null;

  const Component = definition.component as React.ComponentType<{
    props: unknown;
    resolveHref: (href: string) => string;
  }>;
  const element = <Component props={parsed.data} resolveHref={resolveHref} />;

  const design = sectionDesignSchema.safeParse(section.design ?? {});
  if (!design.success || Object.keys(design.data).length === 0) return element;

  return (
    <div style={designStyle(design.data)} data-spacing={design.data.paddingY}>
      {element}
    </div>
  );
}

export function providesPageHeading(theme: RegisteredTheme, type: string) {
  if (type === "hero") return true;
  const custom = theme.components.customSections;
  return Boolean(custom && Object.hasOwn(custom, type) && custom[type]!.providesPageHeading);
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
      {...themeRootProps(theme, document.tokens)}
      className={`site-root flex min-h-dvh flex-col ${className ?? ""}`}
    >
      <Header siteName={document.siteName} logoUrl={document.logoUrl} homeHref={homeHref} links={links} />
      <main className="flex-1">
        {/* Every page needs one h1, and only some sections render it. */}
        {!page.sections.some((section) => section.isVisible && providesPageHeading(theme, section.type)) && (
          <h1 className="sr-only">{page.title}</h1>
        )}
        {page.sections.map((section, index) =>
          section.isVisible ? (
            <Fragment key={index}>{renderSectionContent(theme, section, resolveHref)}</Fragment>
          ) : null,
        )}
      </main>
      <Footer siteName={document.siteName} links={links} />
    </div>
  );
}
