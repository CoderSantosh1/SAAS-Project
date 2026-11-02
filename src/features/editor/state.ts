import type { EditorDocument, EditorPage, EditorSection } from "./types";

const HISTORY_LIMIT = 100;
const COALESCE_MS = 800;

export type History = {
  past: EditorDocument[];
  present: EditorDocument;
  future: EditorDocument[];
  lastKey?: string;
  lastAt: number;
};

export type HistoryAction =
  | { type: "edit"; document: EditorDocument; key?: string; at: number }
  | { type: "undo" }
  | { type: "redo" };

export function createHistory(document: EditorDocument): History {
  return { past: [], present: document, future: [], lastAt: 0 };
}

// Consecutive edits to the same field count as one undo step, so undo removes a
// burst of typing rather than one character.
export function historyReducer(history: History, action: HistoryAction): History {
  switch (action.type) {
    case "undo": {
      const previous = history.past.at(-1);
      if (!previous) return history;
      return {
        past: history.past.slice(0, -1),
        present: previous,
        future: [history.present, ...history.future],
        lastAt: 0,
      };
    }
    case "redo": {
      const [next, ...future] = history.future;
      if (!next) return history;
      return {
        past: [...history.past, history.present],
        present: next,
        future,
        lastAt: 0,
      };
    }
    case "edit": {
      if (action.document === history.present) return history;
      const coalesce =
        action.key !== undefined &&
        action.key === history.lastKey &&
        action.at - history.lastAt < COALESCE_MS;
      return {
        past: coalesce ? history.past : [...history.past, history.present].slice(-HISTORY_LIMIT),
        present: action.document,
        future: [],
        lastKey: action.key,
        lastAt: action.at,
      };
    }
  }
}

function move<T>(items: T[], from: number, to: number) {
  if (from === to || !items[from] || to < 0 || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item as T);
  return next;
}

function mapPage(document: EditorDocument, pageId: string, update: (page: EditorPage) => EditorPage): EditorDocument {
  return { ...document, pages: document.pages.map((page) => (page.id === pageId ? update(page) : page)) };
}

export function updatePage(document: EditorDocument, pageId: string, changes: Partial<EditorPage>) {
  return mapPage(document, pageId, (page) => ({ ...page, ...changes }));
}

export function addPage(document: EditorDocument, page: EditorPage): EditorDocument {
  return { ...document, pages: [...document.pages, page] };
}

// The homepage is protected until another page has explicitly replaced it.
export function removePage(document: EditorDocument, pageId: string): EditorDocument {
  const page = document.pages.find((candidate) => candidate.id === pageId);
  if (!page || page.isHome || document.pages.length === 1) return document;
  return { ...document, pages: document.pages.filter((candidate) => candidate.id !== pageId) };
}

export function setHomePage(document: EditorDocument, pageId: string): EditorDocument {
  return {
    ...document,
    pages: document.pages.map((page) => ({
      ...page,
      isHome: page.id === pageId,
      // A homepage is always reachable.
      isVisible: page.id === pageId ? true : page.isVisible,
    })),
  };
}

export function setPageVisible(document: EditorDocument, pageId: string, isVisible: boolean) {
  const page = document.pages.find((candidate) => candidate.id === pageId);
  if (!page || (page.isHome && !isVisible)) return document;
  return updatePage(document, pageId, { isVisible });
}

export function movePage(document: EditorDocument, from: number, to: number): EditorDocument {
  return { ...document, pages: move(document.pages, from, to) };
}

export function updateSection(
  document: EditorDocument,
  pageId: string,
  sectionId: string,
  changes: Partial<EditorSection>,
) {
  return mapPage(document, pageId, (page) => ({
    ...page,
    sections: page.sections.map((section) => (section.id === sectionId ? { ...section, ...changes } : section)),
  }));
}

export function insertSection(document: EditorDocument, pageId: string, section: EditorSection, afterId?: string) {
  return mapPage(document, pageId, (page) => {
    const index = afterId ? page.sections.findIndex((candidate) => candidate.id === afterId) : -1;
    const at = index === -1 ? page.sections.length : index + 1;
    return { ...page, sections: [...page.sections.slice(0, at), section, ...page.sections.slice(at)] };
  });
}

export function removeSection(document: EditorDocument, pageId: string, sectionId: string) {
  return mapPage(document, pageId, (page) => ({
    ...page,
    sections: page.sections.filter((section) => section.id !== sectionId),
  }));
}

export function moveSection(document: EditorDocument, pageId: string, from: number, to: number) {
  return mapPage(document, pageId, (page) => ({ ...page, sections: move(page.sections, from, to) }));
}

export function duplicateSection(document: EditorDocument, pageId: string, sectionId: string, newId: string) {
  const section = document.pages
    .find((page) => page.id === pageId)
    ?.sections.find((candidate) => candidate.id === sectionId);
  if (!section) return document;
  return insertSection(document, pageId, { ...structuredClone(section), id: newId }, sectionId);
}

export function uniquePageSlug(document: EditorDocument, base: string, exceptPageId?: string) {
  const taken = new Set(document.pages.filter((page) => page.id !== exceptPageId).map((page) => page.slug));
  const root = base || "page";
  if (!taken.has(root)) return root;
  let suffix = 2;
  while (taken.has(`${root}-${suffix}`)) suffix += 1;
  return `${root}-${suffix}`;
}

type Path = (string | number)[];

function isEmptyValue(value: unknown) {
  return (
    value === undefined ||
    value === "" ||
    (typeof value === "object" && value !== null && !Array.isArray(value) && Object.keys(value).length === 0)
  );
}

// Sets a nested value immutably. An emptied optional field is removed, including an
// object left with nothing in it, so an unused button simply disappears.
export function setPath(target: unknown, path: Path, value: unknown): unknown {
  const [head, ...rest] = path;
  if (head === undefined) return value;

  if (Array.isArray(target)) {
    const next = [...target];
    next[head as number] = setPath(next[head as number], rest, value);
    return next;
  }

  const source = (target && typeof target === "object" ? target : {}) as Record<string, unknown>;
  const child = setPath(source[head], rest, value);
  const next = { ...source };
  if (isEmptyValue(child)) delete next[head];
  else next[head] = child;
  return next;
}

export function getPath(target: unknown, path: Path): unknown {
  return path.reduce<unknown>((value, key) => {
    if (value === null || typeof value !== "object") return undefined;
    return (value as Record<string | number, unknown>)[key];
  }, target);
}
