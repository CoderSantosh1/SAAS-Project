import type { SectionField } from "@/themes/types";

export type Path = (string | number)[];

type Targets = { text: Map<string, Path | null>; images: Map<string, Path | null> };

// Records which field each value came from. A value that two fields share is ambiguous,
// so it is marked null and stays editable only from the properties panel.
function remember(map: Map<string, Path | null>, value: unknown, path: Path) {
  if (typeof value !== "string" || !value.trim()) return;
  const key = value.trim();
  const known = map.get(key);
  if (known === undefined) map.set(key, path);
  else if (known && known.join(".") !== path.join(".")) map.set(key, null);
}

function walk(fields: readonly SectionField[], props: unknown, base: Path, targets: Targets) {
  const source = (props && typeof props === "object" ? props : {}) as Record<string, unknown>;
  for (const field of fields) {
    const path = [...base, field.key];
    const value = source[field.key];
    switch (field.kind) {
      case "text":
      case "textarea":
        remember(targets.text, value, path);
        break;
      case "button":
        remember(targets.text, (value as { label?: unknown } | undefined)?.label, [...path, "label"]);
        break;
      case "image":
        remember(targets.images, (value as { src?: unknown } | undefined)?.src, path);
        break;
      case "imageUrl":
        remember(targets.images, value, path);
        break;
      case "list":
        if (Array.isArray(value)) value.forEach((item, index) => walk(field.fields, item, [...path, index], targets));
        break;
    }
  }
}

// Maps the text and images a section shows back to the fields they came from. The
// canvas uses it to let owners edit text in place, whatever markup the theme uses.
export function inlineTargets(fields: readonly SectionField[], props: unknown): Targets {
  const targets: Targets = { text: new Map(), images: new Map() };
  walk(fields, props, [], targets);
  return targets;
}

// An element is editable in place when one of its own text nodes is the whole value and
// everything else inside it, such as an arrow icon, has no text.
export function editableTextNode(element: Element) {
  let found: Text | null = null;
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (!node.textContent?.trim()) continue;
      if (found) return null;
      found = node as Text;
    } else if (node.textContent?.trim()) {
      return null;
    }
  }
  return found;
}
