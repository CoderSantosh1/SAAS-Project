"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { applySiteDesign, resolveThemeTokens, safeLogoUrl } from "@/features/websites/document";
import { getTheme } from "@/themes/registry";
import { renderSectionContent, tokensToCssVariables } from "@/themes/renderer";
import { getSectionDefinition } from "@/themes/sections";
import type { RegisteredTheme } from "@/themes/types";
import { editableTextNode, inlineTargets, type Path } from "../inline-edit";
import { sectionLabel } from "./labels";
import type { EditorDocument, EditorPage } from "../types";

export type Device = "desktop" | "tablet" | "mobile";

const DEVICE_WIDTHS: Record<Device, number> = { desktop: 1280, tablet: 768, mobile: 375 };
const FRAME_DOCUMENT = "<!doctype html><html lang='en'><head></head><body style='margin:0'></body></html>";
const noLink = () => "#";

// Editor-only hints inside the frame: editable text shows a dashed outline on hover.
const FRAME_STYLES = `
[data-edit-path] { cursor: text; }
[data-edit-path]:hover { outline: 2px dashed #7667F5 !important; outline-offset: 3px; }
[data-editing] { outline: 2px solid #7667F5 !important; outline-offset: 3px; background: rgba(118, 103, 245, 0.08); }
[data-edit-image] { cursor: pointer; }
`;

const EDIT_PATH = "data-edit-path";
const EDIT_IMAGE = "data-edit-image";

export type InlineEdit = { sectionId: string; path: Path; value: string };
export type FieldFocus = { sectionId: string; path: Path; focus: boolean };

type Editing = { element: HTMLElement; text: Text; children: ChildNode[]; before: string; sectionId: string; path: Path };

// Marks the text and images in each section that belong to one field, so a click on
// them edits that field. Runs after every render, as edits change what is shown.
function annotate(root: HTMLElement, theme: RegisteredTheme, page: EditorPage, editing: HTMLElement | null) {
  root.querySelectorAll(`[${EDIT_PATH}], [${EDIT_IMAGE}]`).forEach((element) => {
    if (element === editing) return;
    element.removeAttribute(EDIT_PATH);
    element.removeAttribute(EDIT_IMAGE);
  });
  for (const section of page.sections) {
    const wrapper = root.querySelector(`[data-section-id="${section.id}"]`);
    const definition = getSectionDefinition(theme, section.type);
    if (!wrapper || !definition) continue;
    const targets = inlineTargets(definition.fields, section.props);

    const walker = root.ownerDocument.createTreeWalker(wrapper, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const path = targets.text.get(node.textContent?.trim() ?? "");
      const parent = node.parentElement;
      if (!path || !parent || parent === editing || parent.closest("[aria-hidden='true']")) continue;
      if (editableTextNode(parent) === node) parent.setAttribute(EDIT_PATH, JSON.stringify(path));
    }
    wrapper.querySelectorAll("img").forEach((image) => {
      const path = targets.images.get(image.getAttribute("src") ?? "");
      if (path) image.setAttribute(EDIT_IMAGE, JSON.stringify(path));
    });
  }
}

// The topmost marked element under the pointer. Themes often lay gradients or captions
// over a photo, so the click itself may land on something else.
function markedAt(frameDocument: Document, x: number, y: number, attribute: string) {
  return frameDocument.elementsFromPoint(x, y).find((element) => element.hasAttribute(attribute)) as HTMLElement | undefined;
}

function placeCaret(element: HTMLElement, x: number, y: number) {
  const frameDocument = element.ownerDocument as Document & {
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
  };
  const selection = frameDocument.getSelection();
  if (!selection) return;
  let range: Range | null = null;
  const position = frameDocument.caretPositionFromPoint?.(x, y);
  if (position) {
    range = frameDocument.createRange();
    range.setStart(position.offsetNode, position.offset);
  } else {
    range = frameDocument.caretRangeFromPoint?.(x, y) ?? null;
  }
  if (!range || !element.contains(range.startContainer)) {
    range = frameDocument.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
  }
  selection.removeAllRanges();
  selection.addRange(range);
}

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
    const hints = frameDocument.createElement("style");
    hints.textContent = FRAME_STYLES;
    frameDocument.head.appendChild(hints);
    // Shortcuts like undo and save work while the canvas has focus, except during text
    // editing, where the browser's own undo applies.
    frameDocument.addEventListener("keydown", (event) => {
      if (!(event.ctrlKey || event.metaKey) || frameDocument.querySelector("[data-editing]")) return;
      if (!["s", "z", "y"].includes(event.key.toLowerCase())) return;
      event.preventDefault();
      window.dispatchEvent(new KeyboardEvent("keydown", event));
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
  onInlineEdit,
  onFocusField,
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
  onInlineEdit: (edit: InlineEdit) => void;
  onFocusField: (focus: FieldFocus) => void;
  fontClassName: string;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const { root, onLoad } = useFrameRoot(frameRef);
  const [stage, setStage] = useState({ width: 0, height: 0 });
  const editing = useRef<Editing | null>(null);
  const callbacks = useRef<{ onInlineEdit: typeof onInlineEdit; finish: (commit: boolean) => void }>({ onInlineEdit, finish: () => {} });
  const theme = getTheme(themeId, themeVersion);

  // Puts the element back exactly as React rendered it, so React keeps control of it,
  // then saves the new text through the normal edit path.
  const finishEditing = (commit: boolean) => {
    const current = editing.current;
    if (!current) return;
    editing.current = null;
    const { element, text, children, before, sectionId, path } = current;
    const value = (element.textContent ?? "").replace(/\s+/g, " ").trim();
    element.replaceChildren(...children);
    const changed = commit && value !== "" && value !== before;
    text.nodeValue = changed ? value : before;
    element.removeAttribute("contenteditable");
    element.removeAttribute("data-editing");
    if (changed) callbacks.current.onInlineEdit({ sectionId, path, value });
  };

  const startEditing = (element: HTMLElement, sectionId: string, x: number, y: number) => {
    if (editing.current?.element === element) return;
    finishEditing(true);
    const text = editableTextNode(element);
    if (!text) return;
    const path = JSON.parse(element.getAttribute(EDIT_PATH)!) as Path;
    editing.current = { element, text, children: [...element.childNodes], before: text.nodeValue?.trim() ?? "", sectionId, path };
    // Only the text stays while typing, so select-all and delete cannot take an icon with it.
    element.replaceChildren(text);
    try {
      element.contentEditable = "plaintext-only";
    } catch {
      element.contentEditable = "true";
    }
    element.setAttribute("data-editing", "");
    element.focus();
    placeCaret(element, x, y);
    element.addEventListener("blur", () => finishEditing(true), { once: true });
    element.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === "Escape") {
        event.preventDefault();
        finishEditing(event.key === "Enter");
        element.blur();
      }
    });
    onFocusField({ sectionId, path, focus: false });
  };

  useLayoutEffect(() => {
    callbacks.current = { onInlineEdit, finish: finishEditing };
    if (root && theme) annotate(root, theme, page, editing.current?.element ?? null);
  });

  // Switching pages keeps what was typed.
  useEffect(() => () => callbacks.current.finish(true), [page.id]);

  useEffect(() => {
    const element = stageRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setStage({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

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
                      const frameDocument = (event.target as HTMLElement).ownerDocument;
                      const text = markedAt(frameDocument, event.clientX, event.clientY, EDIT_PATH);
                      if (text && event.currentTarget.contains(text)) {
                        startEditing(text, section.id, event.clientX, event.clientY);
                        return;
                      }
                      finishEditing(true);
                      const image = markedAt(frameDocument, event.clientX, event.clientY, EDIT_IMAGE);
                      if (image && event.currentTarget.contains(image)) {
                        onFocusField({ sectionId: section.id, path: JSON.parse(image.getAttribute(EDIT_IMAGE)!) as Path, focus: true });
                      }
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
