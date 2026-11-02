"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { applySiteDesign, resolveThemeTokens, safeLogoUrl } from "@/features/websites/document";
import { getTheme } from "@/themes/registry";
import { renderSectionContent, tokensToCssVariables } from "@/themes/renderer";
import { sectionLabel } from "./labels";
import type { EditorDocument, EditorPage } from "../types";

export type Device = "desktop" | "tablet" | "mobile";

const DEVICE_WIDTHS: Record<Device, number> = { desktop: 1280, tablet: 768, mobile: 375 };
const FRAME_DOCUMENT = "<!doctype html><html lang='en'><head></head><body style='margin:0'></body></html>";
const noLink = () => "#";

// Sections render in an iframe through a portal. The site's responsive styles then
// follow the chosen device's width, while the sections stay part of this React tree
// and update on every edit without a reload.
function useFrameRoot(frame: React.RefObject<HTMLIFrameElement | null>) {
  const [root, setRoot] = useState<HTMLElement | null>(null);

  const onLoad = () => {
    const frameDocument = frame.current?.contentDocument;
    if (!frameDocument) return;
    document.head.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
      const copy = node.cloneNode(true) as HTMLLinkElement;
      if (copy.tagName === "LINK") copy.href = (node as HTMLLinkElement).href;
      frameDocument.head.appendChild(copy);
    });
    setRoot(frameDocument.body);
  };

  return { root, onLoad };
}

export function Canvas({
  document: siteDocument,
  page,
  themeId,
  themeVersion,
  themeTokens,
  device,
  selectedId,
  onSelect,
  fontClassName,
}: {
  document: EditorDocument;
  page: EditorPage;
  themeId: string;
  themeVersion: string;
  themeTokens: unknown;
  device: Device;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  fontClassName: string;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const { root, onLoad } = useFrameRoot(frameRef);
  const [stage, setStage] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = stageRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setStage({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const theme = getTheme(themeId, themeVersion);
  if (!theme) return null;

  const { Header, Footer } = theme.components;
  const width = DEVICE_WIDTHS[device];
  const scale = stage.width ? Math.min(1, stage.width / width) : 1;
  const tokens = applySiteDesign(resolveThemeTokens(themeTokens, theme.definition.tokens), siteDocument.design);
  const links = siteDocument.pages
    .filter((candidate) => candidate.isVisible)
    .map((candidate) => ({ label: candidate.title, href: `#${candidate.slug}` }));

  // Links must not navigate away from the editor.
  const stopLinks = (event: MouseEvent) => {
    if ((event.target as HTMLElement).closest("a")) event.preventDefault();
  };

  return (
    <div ref={stageRef} className="relative h-full w-full overflow-hidden">
      {/* Created only in the browser. A server-rendered frame can finish loading before
          hydration, and its load event would be missed, leaving the canvas blank. */}
      {stage.width > 0 && (
        <iframe
          ref={frameRef}
          srcDoc={FRAME_DOCUMENT}
          onLoad={onLoad}
          title={`Editing ${page.title}`}
          className="absolute top-0 border-0 bg-white shadow-card"
          style={{
            left: Math.max(0, (stage.width - width * scale) / 2),
            width,
            height: stage.height / scale,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        />
      )}
      {root &&
        createPortal(
          <div
            style={tokensToCssVariables(tokens)}
            data-theme={theme.definition.componentId}
            className={`site-root flex min-h-dvh flex-col ${fontClassName}`}
            onClickCapture={stopLinks}
            onClick={() => onSelect(null)}
          >
            <Header
              siteName={siteDocument.businessName || siteDocument.name}
              logoUrl={safeLogoUrl(siteDocument.design)}
              homeHref="#"
              links={links}
            />
            <main className="flex-1">
              {page.sections.length === 0 && (
                <p className="px-6 py-24 text-center opacity-70">This page is empty. Add a section from the left panel.</p>
              )}
              {page.sections.map((section) => {
                const content = renderSectionContent(theme, section, noLink);
                const selected = section.id === selectedId;
                return (
                  <div
                    key={section.id}
                    data-section-id={section.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelect(section.id);
                    }}
                    className={`group relative cursor-pointer ${section.isVisible ? "" : "opacity-40"}`}
                  >
                    {content ?? (
                      <div className="flex items-center justify-center gap-2 bg-amber-50 px-6 py-12 text-sm text-amber-900">
                        <AlertTriangle className="size-4" aria-hidden />
                        {sectionLabel(theme, section.type)} needs attention. Select it to fix its content.
                      </div>
                    )}
                    <div
                      className={`pointer-events-none absolute inset-0 z-10 outline-offset-[-2px] ${
                        selected ? "outline-2 outline-[#7667F5]" : "group-hover:outline-2 group-hover:outline-[#A99DFF]"
                      }`}
                    >
                      <span
                        className={`absolute top-0 left-0 bg-[#7667F5] px-2 py-0.5 font-sans text-xs font-semibold text-white ${
                          selected ? "" : "hidden group-hover:block"
                        }`}
                      >
                        {sectionLabel(theme, section.type)}
                        {section.isVisible ? "" : " (hidden)"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </main>
            <Footer siteName={siteDocument.businessName || siteDocument.name} links={links} />
          </div>,
          root,
        )}
    </div>
  );
}
