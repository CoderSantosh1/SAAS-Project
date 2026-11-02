"use client";

import {
  AlertTriangle,
  Check,
  CircleDashed,
  ExternalLink,
  FileStack,
  Image as ImageIcon,
  Layers,
  Menu,
  Monitor,
  Palette,
  Redo2,
  Rocket,
  Save,
  Settings,
  Smartphone,
  Tablet,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useReducer, useState } from "react";
import { Button } from "@/components/ui/button";
import { brand } from "@/config/brand";
import { resolveThemeTokens } from "@/features/websites/document";
import { getTheme } from "@/themes/registry";
import { getSectionDefinition } from "@/themes/sections";
import { createHistory, historyReducer, updateSection } from "../state";
import type { EditorData, EditorDocument } from "../types";
import { Canvas, type Device } from "./canvas";
import { PropertiesPanel } from "./properties-panel";
import {
  DesignPanel,
  MediaPanel,
  NavigationPanel,
  PagesPanel,
  SectionsPanel,
  SettingsPanel,
  type PanelProps,
} from "./side-panels";
import { useAutosave, type SaveState } from "./use-autosave";

type PanelId = "pages" | "sections" | "design" | "media" | "navigation" | "settings";

const PANELS: { id: PanelId; label: string; icon: LucideIcon }[] = [
  { id: "pages", label: "Pages", icon: FileStack },
  { id: "sections", label: "Sections", icon: Layers },
  { id: "design", label: "Design", icon: Palette },
  { id: "media", label: "Media", icon: ImageIcon },
  { id: "navigation", label: "Navigation", icon: Menu },
  { id: "settings", label: "Settings", icon: Settings },
];

const DEVICES: { id: Device; label: string; icon: LucideIcon }[] = [
  { id: "desktop", label: "Desktop", icon: Monitor },
  { id: "tablet", label: "Tablet", icon: Tablet },
  { id: "mobile", label: "Mobile", icon: Smartphone },
];

const SAVE_LABELS: Record<SaveState, { text: string; icon: LucideIcon; className: string }> = {
  saved: { text: "All changes saved", icon: Check, className: "text-green-800" },
  unsaved: { text: "Unsaved changes", icon: CircleDashed, className: "text-secondary-text" },
  saving: { text: "Saving...", icon: CircleDashed, className: "text-secondary-text" },
  error: { text: "Not saved", icon: AlertTriangle, className: "text-danger" },
  conflict: { text: "Not saved", icon: AlertTriangle, className: "text-danger" },
  "signed-out": { text: "Not saved", icon: AlertTriangle, className: "text-danger" },
};

const TOOL_BUTTON =
  "rounded-md p-2 text-secondary-text transition-colors hover:bg-background hover:text-foreground disabled:pointer-events-none disabled:opacity-40";

export function Editor({ data, fontClassName }: { data: EditorData; fontClassName: string }) {
  const [history, dispatch] = useReducer(historyReducer, data.document, createHistory);
  const document = history.present;
  const { state: saveState, errorMessage, save } = useAutosave(data.id, data.revision, document);

  const [panel, setPanel] = useState<PanelId>("sections");
  const [device, setDevice] = useState<Device>("desktop");
  const [pageId, setPageId] = useState(
    () => (document.pages.find((page) => page.isHome) ?? document.pages[0]!).id,
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Undo or a restored version can remove the page in view, or the selected section.
  const page = document.pages.find((candidate) => candidate.id === pageId) ?? document.pages[0]!;
  const selected = page.sections.find((section) => section.id === selectedId) ?? null;

  const edit = useCallback((next: EditorDocument, key?: string) => {
    dispatch({ type: "edit", document: next, key, at: Date.now() });
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (key === "s") {
        event.preventDefault();
        void save();
      } else if (key === "z") {
        event.preventDefault();
        dispatch({ type: event.shiftKey ? "redo" : "undo" });
      } else if (key === "y") {
        event.preventDefault();
        dispatch({ type: "redo" });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [save]);

  const openPreview = async () => {
    // Opened first, because browsers block pop-ups that follow an awaited call.
    const preview = window.open("about:blank", "_blank");
    if (await save()) {
      if (preview) preview.location.href = `/preview/sites/${data.id}`;
    } else {
      preview?.close();
    }
  };

  const select = (id: string | null) => {
    setSelectedId(id);
    if (id) setPanel("sections");
  };

  const theme = getTheme(data.component_id!, data.version!);
  const panelProps: PanelProps = {
    websiteId: data.id,
    theme,
    document,
    edit,
    page,
    setPageId,
    selectedId: selected?.id ?? null,
    setSelectedId: select,
  };

  const baseTokens = theme ? resolveThemeTokens(data.design_tokens, theme.definition.tokens) : null;
  const primaryFallback = baseTokens?.primary ?? "#000000";
  const status = SAVE_LABELS[saveState];
  const blocked = saveState === "conflict" || saveState === "signed-out";

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border bg-surface px-3 py-2">
        <Link href="/dashboard/websites" className="font-heading text-lg font-bold text-primary" title="Back to My Websites">
          {brand.name}
        </Link>
        <span className="max-w-48 truncate text-sm font-semibold">{document.name}</span>
        <span role="status" className={`flex items-center gap-1 text-xs ${status.className}`}>
          <status.icon className="size-3.5" aria-hidden />
          {status.text}
        </span>

        <div className="ml-auto flex items-center gap-1">
          <button type="button" className={TOOL_BUTTON} aria-label="Undo" title="Undo (Ctrl+Z)" disabled={history.past.length === 0} onClick={() => dispatch({ type: "undo" })}>
            <Undo2 className="size-4" aria-hidden />
          </button>
          <button type="button" className={TOOL_BUTTON} aria-label="Redo" title="Redo (Ctrl+Y)" disabled={history.future.length === 0} onClick={() => dispatch({ type: "redo" })}>
            <Redo2 className="size-4" aria-hidden />
          </button>
          <button type="button" className={TOOL_BUTTON} aria-label="Save" title="Save (Ctrl+S)" disabled={blocked} onClick={() => void save()}>
            <Save className="size-4" aria-hidden />
          </button>

          <div role="group" aria-label="Preview size" className="mx-1 flex rounded-md border border-border">
            {DEVICES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-label={label}
                aria-pressed={device === id}
                title={label}
                onClick={() => setDevice(id)}
                className={`p-2 transition-colors ${device === id ? "bg-primary-light text-primary-hover" : "text-secondary-text hover:bg-background"}`}
              >
                <Icon className="size-4" aria-hidden />
              </button>
            ))}
          </div>

          <Button type="button" variant="secondary" className="h-9 px-3 text-sm" disabled={blocked} onClick={() => void openPreview()}>
            <ExternalLink className="size-4" aria-hidden />
            Preview
          </Button>
          <Button type="button" className="h-9 px-3 text-sm" disabled title="Publishing is coming soon">
            <Rocket className="size-4" aria-hidden />
            Publish
          </Button>
        </div>
      </header>

      {saveState === "conflict" && (
        <p role="alert" className="flex flex-wrap items-center gap-2 bg-danger/10 px-4 py-2 text-sm text-red-800">
          This website was changed in another tab or device, so your latest edits were not saved.
          <button type="button" className="font-semibold underline" onClick={() => window.location.reload()}>
            Reload the latest version
          </button>
        </p>
      )}
      {saveState === "signed-out" && (
        <p role="alert" className="flex flex-wrap items-center gap-2 bg-danger/10 px-4 py-2 text-sm text-red-800">
          You are signed out, so your latest edits were not saved. Keep this tab open, and sign in again in a new tab.
          <button type="button" className="font-semibold underline" onClick={() => window.location.reload()}>
            Reload after signing in
          </button>
        </p>
      )}
      {saveState === "error" && (
        <p role="alert" className="flex flex-wrap items-center gap-2 bg-danger/10 px-4 py-2 text-sm text-red-800">
          {errorMessage ?? "We could not save your changes."}
          <button type="button" className="font-semibold underline" onClick={() => void save()}>
            Try again
          </button>
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="flex max-h-[40dvh] min-h-0 shrink-0 border-b border-border bg-surface lg:max-h-none lg:w-80 lg:border-r lg:border-b-0">
          <nav aria-label="Editor panels" className="flex w-14 shrink-0 flex-col gap-1 overflow-y-auto border-r border-border p-1.5">
            {PANELS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-label={label}
                aria-current={panel === id ? "true" : undefined}
                title={label}
                onClick={() => setPanel(id)}
                className={`flex justify-center rounded-md p-2.5 transition-colors ${
                  panel === id ? "bg-primary-light text-primary-hover" : "text-secondary-text hover:bg-background"
                }`}
              >
                <Icon className="size-5" aria-hidden />
              </button>
            ))}
          </nav>
          <div className="min-w-0 flex-1 overflow-y-auto p-3">
            {panel === "pages" && <PagesPanel {...panelProps} />}
            {panel === "sections" && <SectionsPanel {...panelProps} />}
            {panel === "design" && <DesignPanel {...panelProps} primaryFallback={primaryFallback} />}
            {panel === "media" && <MediaPanel />}
            {panel === "navigation" && <NavigationPanel {...panelProps} />}
            {panel === "settings" && <SettingsPanel {...panelProps} save={save} />}
          </div>
        </aside>

        <main className="min-h-64 min-w-0 flex-1 p-3">
          <Canvas
            document={document}
            page={page}
            themeId={data.component_id!}
            themeVersion={data.version!}
            themeTokens={data.design_tokens}
            device={device}
            selectedId={selected?.id ?? null}
            onSelect={select}
            fontClassName={fontClassName}
          />
        </main>

        <aside className="max-h-[40dvh] min-h-0 shrink-0 overflow-hidden border-t border-border bg-surface lg:max-h-none lg:w-80 lg:border-t-0 lg:border-l">
          <PropertiesPanel
            key={selected?.id ?? "none"}
            section={selected}
            definition={selected ? getSectionDefinition(theme, selected.type) : null}
            onChange={(changes, key) => {
              if (selected) edit(updateSection(document, page.id, selected.id, changes), key);
            }}
          />
        </aside>
      </div>
    </div>
  );
}
