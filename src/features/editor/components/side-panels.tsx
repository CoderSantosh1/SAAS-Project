"use client";

import { Copy, Eye, EyeOff, History, Home, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { slugify } from "@/features/websites/schemas";
import type { RegisteredTheme } from "@/themes/types";
import { createCheckpoint, getCheckpoint, listCheckpoints } from "../actions";
import { listSectionDefinitions, type SectionDefinition } from "../sections";
import {
  addPage,
  duplicateSection,
  insertSection,
  movePage,
  moveSection,
  removePage,
  removeSection,
  setHomePage,
  setPageVisible,
  uniquePageSlug,
  updatePage,
} from "../state";
import type { EditorDocument, EditorPage, VersionSummary } from "../types";
import { CommitInput, ColorField, ICON_BUTTON, ImagePicker, Labeled, MediaGrid, TextArea } from "./controls";
import { sectionLabel } from "./labels";
import { SortableList } from "./sortable-list";

type Edit = (document: EditorDocument, key?: string) => void;

export type PanelProps = {
  websiteId: string;
  theme: RegisteredTheme | null;
  document: EditorDocument;
  edit: Edit;
  page: EditorPage;
  setPageId: (id: string) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
};

export function PanelHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-sm font-semibold">{children}</h2>;
}

export function SectionsPanel({ theme, document, edit, page, selectedId, setSelectedId }: PanelProps) {
  const [adding, setAdding] = useState(false);
  const label = (type: string) => sectionLabel(theme, type);

  const add = (definition: SectionDefinition) => {
    const id = crypto.randomUUID();
    const props = structuredClone(definition.defaults);
    edit(insertSection(document, page.id, { id, type: definition.type, props, design: {}, isVisible: true }, selectedId ?? undefined));
    setSelectedId(id);
    setAdding(false);
  };

  return (
    <div>
      <PanelHeading>Sections on {page.title}</PanelHeading>
      {page.sections.length === 0 && <p className="mb-3 text-xs text-secondary-text">This page has no sections yet.</p>}
      <SortableList
        dndId="sections"
        items={page.sections}
        getLabel={(section) => label(section.type)}
        onMove={(from, to) => edit(moveSection(document, page.id, from, to))}
        renderItem={(section) => (
          <div className="flex items-center">
            <button
              type="button"
              aria-current={section.id === selectedId ? "true" : undefined}
              onClick={() => setSelectedId(section.id)}
              className={`min-w-0 flex-1 truncate py-2 pr-1 text-left text-sm ${
                section.id === selectedId ? "font-semibold text-primary-hover" : ""
              } ${section.isVisible ? "" : "text-muted-text"}`}
            >
              {label(section.type)}
            </button>
            <button
              type="button"
              className={ICON_BUTTON}
              aria-label={`Duplicate ${label(section.type)}`}
              onClick={() => {
                const id = crypto.randomUUID();
                edit(duplicateSection(document, page.id, section.id, id));
                setSelectedId(id);
              }}
            >
              <Copy className="size-3.5" aria-hidden />
            </button>
            <button
              type="button"
              className={`${ICON_BUTTON} hover:text-danger`}
              aria-label={`Delete ${label(section.type)}`}
              onClick={() => {
                edit(removeSection(document, page.id, section.id));
                if (selectedId === section.id) setSelectedId(null);
              }}
            >
              <Trash2 className="size-3.5" aria-hidden />
            </button>
          </div>
        )}
      />
      <Button type="button" variant="secondary" className="mt-3 h-9 w-full text-sm" aria-expanded={adding} onClick={() => setAdding(!adding)}>
        <Plus className="size-4" aria-hidden />
        Add section
      </Button>
      {adding && (
        <ul className="mt-2 grid grid-cols-2 gap-1.5">
          {listSectionDefinitions(theme).map((definition) => (
            <li key={definition.type}>
              <button
                type="button"
                onClick={() => add(definition)}
                className="h-full w-full rounded-md border border-border px-2 py-2 text-xs font-medium hover:border-primary hover:bg-primary-light"
              >
                {definition.label}
                {definition.custom && <span className="block text-[10px] font-normal text-secondary-text">This theme only</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function PagesPanel({ document, edit, page, setPageId, setSelectedId }: PanelProps) {
  const addNewPage = () => {
    const id = crypto.randomUUID();
    edit(
      addPage(document, {
        id,
        title: "New page",
        slug: uniquePageSlug(document, "new-page"),
        isHome: false,
        isVisible: true,
        seo: {},
        sections: [],
      }),
    );
    setPageId(id);
    setSelectedId(null);
  };

  return (
    <div>
      <PanelHeading>Pages</PanelHeading>
      <SortableList
        dndId="pages"
        items={document.pages}
        getLabel={(item) => item.title}
        onMove={(from, to) => edit(movePage(document, from, to))}
        renderItem={(item) => (
          <button
            type="button"
            aria-current={item.id === page.id ? "page" : undefined}
            onClick={() => {
              setPageId(item.id);
              setSelectedId(null);
            }}
            className={`flex w-full items-center gap-1.5 py-2 pr-2 text-left text-sm ${
              item.id === page.id ? "font-semibold text-primary-hover" : ""
            }`}
          >
            <span className="min-w-0 flex-1 truncate">{item.title}</span>
            {item.isHome && <Home className="size-3.5 shrink-0" aria-label="Homepage" />}
            {!item.isVisible && <EyeOff className="size-3.5 shrink-0 text-muted-text" aria-label="Hidden" />}
          </button>
        )}
      />
      <Button type="button" variant="secondary" className="mt-3 h-9 w-full text-sm" onClick={addNewPage}>
        <Plus className="size-4" aria-hidden />
        Add page
      </Button>

      <div key={page.id} className="mt-5 space-y-3 border-t border-border pt-4">
        <h3 className="text-xs font-semibold tracking-wide text-secondary-text uppercase">{page.title} settings</h3>
        <Labeled label="Page name">
          <CommitInput
            className="h-9"
            value={page.title}
            onCommit={(title) => {
              if (title.trim()) edit(updatePage(document, page.id, { title: title.trim() }));
            }}
          />
        </Labeled>
        {!page.isHome && (
          <Labeled label="Page address">
            <CommitInput
              className="h-9"
              value={page.slug}
              onCommit={(value) => {
                const slug = slugify(value);
                if (slug && slug !== page.slug) {
                  edit(updatePage(document, page.id, { slug: uniquePageSlug(document, slug, page.id) }));
                }
              }}
            />
          </Labeled>
        )}
        <Labeled label="Search engine title">
          <CommitInput
            className="h-9"
            maxLength={120}
            value={page.seo.title ?? ""}
            onCommit={(title) => edit(updatePage(document, page.id, { seo: { ...page.seo, title: title.trim() || undefined } }))}
          />
        </Labeled>
        <Labeled label="Search engine description">
          <TextArea
            maxLength={300}
            value={page.seo.description ?? ""}
            onChange={(event) =>
              edit(
                updatePage(document, page.id, { seo: { ...page.seo, description: event.target.value || undefined } }),
                `${page.id}:seo-description`,
              )
            }
          />
        </Labeled>
        {page.isHome ? (
          <p className="text-xs text-secondary-text">
            This is your homepage. To remove or hide it, first set another page as home.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            <Button type="button" variant="secondary" className="h-9 text-sm" onClick={() => edit(setHomePage(document, page.id))}>
              <Home className="size-4" aria-hidden />
              Set as homepage
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-9 text-sm"
              onClick={() => edit(setPageVisible(document, page.id, !page.isVisible))}
            >
              {page.isVisible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
              {page.isVisible ? "Hide page" : "Show page"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-9 text-sm text-danger hover:text-danger"
              onClick={() => {
                const home = document.pages.find((candidate) => candidate.isHome);
                edit(removePage(document, page.id));
                if (home) setPageId(home.id);
                setSelectedId(null);
              }}
            >
              <Trash2 className="size-4" aria-hidden />
              Delete page
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function NavigationPanel({ document, edit }: PanelProps) {
  return (
    <div>
      <PanelHeading>Navigation menu</PanelHeading>
      <p className="mb-3 text-xs text-secondary-text">Drag to set the menu order. Hidden pages leave the menu and the website.</p>
      <SortableList
        dndId="navigation"
        items={document.pages}
        getLabel={(item) => item.title}
        onMove={(from, to) => edit(movePage(document, from, to))}
        renderItem={(item) => (
          <div className="flex items-center justify-between gap-2 py-1 pr-1">
            <span className={`min-w-0 truncate text-sm ${item.isVisible ? "" : "text-muted-text"}`}>{item.title}</span>
            <button
              type="button"
              disabled={item.isHome}
              className={ICON_BUTTON}
              aria-label={item.isVisible ? `Hide ${item.title}` : `Show ${item.title}`}
              onClick={() => edit(setPageVisible(document, item.id, !item.isVisible))}
            >
              {item.isVisible ? <Eye className="size-4" aria-hidden /> : <EyeOff className="size-4" aria-hidden />}
            </button>
          </div>
        )}
      />
    </div>
  );
}

const FONTS = [
  { value: "inter", label: "Inter" },
  { value: "cormorant", label: "Cormorant Garamond" },
  { value: "sora", label: "Sora" },
  { value: "space-grotesk", label: "Space Grotesk" },
  { value: "playfair", label: "Playfair Display" },
  { value: "lora", label: "Lora" },
] as const;

export function DesignPanel({ document, edit, primaryFallback }: PanelProps & { primaryFallback: string }) {
  const setDesign = (changes: Partial<EditorDocument["design"]>, key: string) => {
    const design = { ...document.design, ...changes };
    for (const name of Object.keys(design) as (keyof typeof design)[]) {
      if (design[name] === undefined) delete design[name];
    }
    edit({ ...document, design }, `design:${key}`);
  };

  return (
    <div className="space-y-4">
      <PanelHeading>Website design</PanelHeading>
      <ColorField
        label="Primary color"
        value={document.design.primary}
        fallback={primaryFallback}
        onChange={(primary) => setDesign({ primary }, "primary")}
      />
      <ImagePicker
        label="Logo"
        value={document.design.logoUrl ?? ""}
        onChange={(url) => setDesign({ logoUrl: url || undefined }, "logo")}
      />
      {(["headingFont", "bodyFont"] as const).map((name) => (
        <Labeled key={name} label={name === "headingFont" ? "Heading font" : "Body font"}>
          <select
            value={document.design[name] ?? ""}
            onChange={(event) =>
              setDesign({ [name]: (event.target.value || undefined) as (typeof FONTS)[number]["value"] | undefined }, name)
            }
            className="h-9 w-full rounded-md border border-border bg-surface px-2 text-sm"
          >
            <option value="">Theme default</option>
            {FONTS.map((font) => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>
        </Labeled>
      ))}
      <Labeled label="Corners">
        <select
          value={document.design.radius ?? ""}
          onChange={(event) =>
            setDesign({ radius: (event.target.value || undefined) as "none" | "md" | "lg" | undefined }, "radius")
          }
          className="h-9 w-full rounded-md border border-border bg-surface px-2 text-sm"
        >
          <option value="">Theme default</option>
          <option value="none">Square</option>
          <option value="md">Slightly rounded</option>
          <option value="lg">Rounded</option>
        </select>
      </Labeled>
    </div>
  );
}

export function MediaPanel() {
  return (
    <div>
      <PanelHeading>Media</PanelHeading>
      <p className="mb-3 text-xs text-secondary-text">Upload here, then choose the image from a section&apos;s settings.</p>
      <MediaGrid />
    </div>
  );
}

export function SettingsPanel({
  websiteId,
  document,
  edit,
  save,
}: PanelProps & { save: () => Promise<boolean> }) {
  const [versions, setVersions] = useState<VersionSummary[] | null>(null);
  const [label, setLabel] = useState("");
  const [message, setMessage] = useState<{ error?: boolean; text: string }>();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    listCheckpoints(websiteId)
      .then((result) => {
        if (active) setVersions(result);
      })
      .catch(() => {
        if (active) setMessage({ error: true, text: "We could not load your saved versions." });
      });
    return () => {
      active = false;
    };
  }, [websiteId]);

  const saveVersion = () =>
    startTransition(async () => {
      setMessage(undefined);
      // A version captures what is saved, so unsaved edits must be saved first.
      if (!(await save())) {
        setMessage({ error: true, text: "Save your changes first, then try again." });
        return;
      }
      const result = await createCheckpoint(websiteId, label);
      if (result.error) {
        setMessage({ error: true, text: result.error });
        return;
      }
      setLabel("");
      setMessage({ text: "Version saved." });
      setVersions(await listCheckpoints(websiteId));
    });

  const restore = (version: VersionSummary) =>
    startTransition(async () => {
      setMessage(undefined);
      const snapshot = await getCheckpoint(websiteId, version.id);
      if (!snapshot) {
        setMessage({ error: true, text: "We could not restore that version." });
        return;
      }
      edit(snapshot);
      setMessage({ text: "Version restored. Use Undo if you change your mind." });
    });

  return (
    <div className="space-y-4">
      <PanelHeading>Website settings</PanelHeading>
      <Labeled label="Website name">
        <CommitInput
          className="h-9"
          value={document.name}
          onCommit={(name) => {
            if (name.trim()) edit({ ...document, name: name.trim() });
          }}
        />
      </Labeled>
      <Labeled label="Business name">
        <CommitInput
          className="h-9"
          value={document.businessName ?? ""}
          onCommit={(value) => edit({ ...document, businessName: value.trim() || null })}
        />
      </Labeled>
      <Link href={`/dashboard/websites/${websiteId}/settings`} className="block text-sm font-semibold text-primary hover:text-primary-hover">
        Change web address
      </Link>

      <div className="space-y-2 border-t border-border pt-4">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <History className="size-4" aria-hidden />
          Version history
        </h3>
        <div className="flex gap-1.5">
          <input
            aria-label="Version name"
            placeholder="Name (optional)"
            maxLength={80}
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            className="h-9 min-w-0 flex-1 rounded-md border border-border bg-surface px-2 text-sm"
          />
          <Button type="button" className="h-9 px-3 text-xs" disabled={pending} onClick={saveVersion}>
            Save version
          </Button>
        </div>
        {message && (
          <p role={message.error ? "alert" : "status"} className={`text-xs ${message.error ? "text-danger" : "text-green-800"}`}>
            {message.text}
          </p>
        )}
        {versions === null && !message && <p className="text-xs text-secondary-text">Loading versions...</p>}
        {versions?.length === 0 && <p className="text-xs text-secondary-text">No saved versions yet.</p>}
        <ul className="space-y-1.5">
          {versions?.map((version) => (
            <li key={version.id} className="flex items-center justify-between gap-2 rounded-md border border-border px-2.5 py-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">{version.label ?? `Version ${version.version_number}`}</p>
                <p className="text-xs text-secondary-text">
                  {new Date(version.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
              <Button type="button" variant="ghost" className="h-8 px-2 text-xs" disabled={pending} onClick={() => restore(version)}>
                Restore
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
