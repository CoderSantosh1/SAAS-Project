"use client";

import { ArrowDown, ArrowUp, MousePointerClick, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SectionDesign } from "@/themes/types";
import { sectionIssues, type EditorField, type SectionDefinition } from "../sections";
import { getPath, setPath } from "../state";
import type { EditorSection } from "../types";
import { ColorField, ICON_BUTTON, ImagePicker, LABEL, Labeled, TextArea } from "./controls";

type Path = (string | number)[];

type FieldContext = {
  props: Record<string, unknown>;
  issues: Record<string, string>;
  onChange: (path: Path, value: unknown) => void;
};

function issueFor(issues: Record<string, string>, path: Path) {
  return issues[path.join(".")];
}

function Field({ field, base, context }: { field: EditorField; base: Path; context: FieldContext }) {
  const path = [...base, field.key];
  const value = getPath(context.props, path);
  const text = typeof value === "string" ? value : "";
  const keyId = path.join(".");
  const error = issueFor(context.issues, path);

  switch (field.kind) {
    case "text":
    case "link":
      return (
        <Labeled label={field.label} error={error}>
          <Input
            className="h-9"
            value={text}
            onChange={(event) => context.onChange(path, event.target.value)}
            aria-invalid={error ? true : undefined}
          />
        </Labeled>
      );
    case "textarea":
      return (
        <Labeled label={field.label} error={error}>
          <TextArea value={text} onChange={(event) => context.onChange(path, event.target.value)} />
        </Labeled>
      );
    case "select":
      return (
        <Labeled label={field.label} error={error}>
          <select
            value={text}
            onChange={(event) => context.onChange(path, event.target.value)}
            className="h-9 w-full rounded-md border border-border bg-surface px-2 text-sm"
          >
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Labeled>
      );
    case "imageUrl":
      return (
        <ImagePicker
          label={field.label}
          value={text}
          error={error}
          onChange={(url) => context.onChange(path, url)}
        />
      );
    case "image": {
      const src = getPath(context.props, [...path, "src"]);
      const alt = getPath(context.props, [...path, "alt"]);
      return (
        <div className="space-y-2">
          <ImagePicker
            label={field.label}
            value={typeof src === "string" ? src : ""}
            error={issueFor(context.issues, [...path, "src"]) ?? error}
            onChange={(url) => context.onChange(path, url ? { src: url, alt: typeof alt === "string" ? alt : "" } : undefined)}
          />
          {typeof src === "string" && (
            <Labeled label="Description for screen readers">
              <Input
                className="h-9"
                value={typeof alt === "string" ? alt : ""}
                onChange={(event) => context.onChange(path, { src, alt: event.target.value })}
              />
            </Labeled>
          )}
        </div>
      );
    }
    case "button": {
      const label = getPath(context.props, [...path, "label"]);
      const href = getPath(context.props, [...path, "href"]);
      return (
        <fieldset className="space-y-2 rounded-md border border-border p-2.5">
          <legend className={`${LABEL} px-1`}>{field.label}</legend>
          <Labeled label="Text" error={issueFor(context.issues, [...path, "label"]) ?? error}>
            <Input
              className="h-9"
              value={typeof label === "string" ? label : ""}
              onChange={(event) => context.onChange([...path, "label"], event.target.value)}
            />
          </Labeled>
          <Labeled label="Link" error={issueFor(context.issues, [...path, "href"])}>
            <Input
              className="h-9"
              placeholder="/contact or https://..."
              value={typeof href === "string" ? href : ""}
              onChange={(event) => context.onChange([...path, "href"], event.target.value)}
            />
          </Labeled>
        </fieldset>
      );
    }
    case "list": {
      const items = Array.isArray(value) ? value : [];
      const setItems = (next: unknown[]) => context.onChange(path, next);
      return (
        <fieldset className="space-y-2">
          <legend className={LABEL}>{field.label}</legend>
          {error && <p className="text-xs text-danger">{error}</p>}
          {items.map((_, index) => (
            <div key={`${keyId}.${index}`} className="space-y-2 rounded-md border border-border p-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">
                  {field.itemLabel} {index + 1}
                </span>
                <div className="flex">
                  <button
                    type="button"
                    className={ICON_BUTTON}
                    disabled={index === 0}
                    aria-label={`Move ${field.itemLabel} ${index + 1} up`}
                    onClick={() => setItems(swap(items, index, index - 1))}
                  >
                    <ArrowUp className="size-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    className={ICON_BUTTON}
                    disabled={index === items.length - 1}
                    aria-label={`Move ${field.itemLabel} ${index + 1} down`}
                    onClick={() => setItems(swap(items, index, index + 1))}
                  >
                    <ArrowDown className="size-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    className={ICON_BUTTON}
                    aria-label={`Remove ${field.itemLabel} ${index + 1}`}
                    onClick={() => setItems(items.filter((__, other) => other !== index))}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                </div>
              </div>
              {field.fields.map((child) => (
                <Field key={child.key} field={child} base={[...path, index]} context={context} />
              ))}
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            className="h-9 w-full text-xs"
            onClick={() => setItems([...items, structuredClone(field.newItem)])}
          >
            Add {field.itemLabel.toLowerCase()}
          </Button>
        </fieldset>
      );
    }
  }
}

function swap<T>(items: T[], a: number, b: number) {
  const next = [...items];
  [next[a], next[b]] = [next[b] as T, next[a] as T];
  return next;
}

const SPACING: { value: NonNullable<SectionDesign["paddingY"]> | ""; label: string }[] = [
  { value: "", label: "Theme default" },
  { value: "none", label: "None" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
];

export function PropertiesPanel({
  section,
  definition,
  onChange,
}: {
  section: EditorSection | null;
  definition: SectionDefinition | null;
  onChange: (changes: Partial<EditorSection>, key: string) => void;
}) {
  const [tab, setTab] = useState<"content" | "design">("content");

  if (!section) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <MousePointerClick className="size-8 text-accent" aria-hidden />
        <p className="mt-3 text-sm font-medium">Select a section</p>
        <p className="mt-1 text-xs text-secondary-text">Click any section in the preview to edit it here.</p>
      </div>
    );
  }

  const fields = definition?.fields ?? [];
  const issues = sectionIssues(definition, section.props);
  const context: FieldContext = {
    props: section.props,
    issues,
    onChange: (path, value) =>
      onChange(
        { props: setPath(section.props, path, value) as Record<string, unknown> },
        `${section.id}:${path.join(".")}`,
      ),
  };
  const setDesign = (changes: SectionDesign, key: string) => {
    const design = { ...section.design, ...changes };
    for (const name of Object.keys(design) as (keyof SectionDesign)[]) {
      if (design[name] === undefined) delete design[name];
    }
    onChange({ design }, `${section.id}:design.${key}`);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-3">
        <h2 className="text-sm font-semibold">{definition?.label ?? "Unknown section"}</h2>
        <div role="tablist" aria-label="Section settings" className="mt-2 flex gap-1">
          {(["content", "design"] as const).map((name) => (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={tab === name}
              onClick={() => setTab(name)}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold capitalize ${
                tab === name ? "bg-primary-light text-primary-hover" : "text-secondary-text hover:bg-background"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {tab === "content" ? (
          <>
            {Object.keys(issues).length > 0 && (
              <p role="status" className="rounded-md bg-warning/15 px-2.5 py-2 text-xs text-amber-900">
                Fix the marked fields. This section will not show on your website until then.
              </p>
            )}
            {fields.map((field) => (
              <Field key={field.key} field={field} base={[]} context={context} />
            ))}
          </>
        ) : (
          <>
            <ColorField
              label="Background color"
              value={section.design.backgroundColor}
              fallback="#ffffff"
              onChange={(backgroundColor) => setDesign({ backgroundColor }, "background")}
            />
            <ColorField
              label="Text color"
              value={section.design.textColor}
              fallback="#111111"
              onChange={(textColor) => setDesign({ textColor }, "text")}
            />
            <Labeled label="Spacing above and below">
              <select
                value={section.design.paddingY ?? ""}
                onChange={(event) =>
                  setDesign({ paddingY: (event.target.value || undefined) as SectionDesign["paddingY"] }, "spacing")
                }
                className="h-9 w-full rounded-md border border-border bg-surface px-2 text-sm"
              >
                {SPACING.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Labeled>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={section.isVisible}
                onChange={(event) => onChange({ isVisible: event.target.checked }, `${section.id}:visible`)}
                className="size-4 accent-primary"
              />
              Show this section
            </label>
          </>
        )}
      </div>
    </div>
  );
}
