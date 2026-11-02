import { describe, expect, it } from "vitest";
import {
  addPage,
  createHistory,
  duplicateSection,
  getPath,
  historyReducer,
  insertSection,
  movePage,
  moveSection,
  removePage,
  removeSection,
  setHomePage,
  setPageVisible,
  setPath,
  uniquePageSlug,
} from "@/features/editor/state";
import type { EditorDocument, EditorSection } from "@/features/editor/types";
import { editorDocumentSchema } from "@/features/editor/types";

const section = (id: string): EditorSection => ({ id, type: "hero", props: { heading: id }, design: {}, isVisible: true });

const doc = (): EditorDocument => ({
  name: "Site",
  businessName: null,
  design: {},
  pages: [
    { id: "home", title: "Home", slug: "home", isHome: true, isVisible: true, seo: {}, sections: [section("a"), section("b"), section("c")] },
    { id: "about", title: "About", slug: "about", isHome: false, isVisible: true, seo: {}, sections: [] },
  ],
});

const named = (name: string): EditorDocument => ({ ...doc(), name });

describe("history", () => {
  it("undoes and redoes, and a new edit clears redo", () => {
    let history = createHistory(named("0"));
    history = historyReducer(history, { type: "edit", document: named("1"), at: 1000 });
    history = historyReducer(history, { type: "edit", document: named("2"), at: 5000 });
    history = historyReducer(history, { type: "undo" });
    expect(history.present.name).toBe("1");
    history = historyReducer(history, { type: "redo" });
    expect(history.present.name).toBe("2");
    history = historyReducer(history, { type: "undo" });
    history = historyReducer(history, { type: "edit", document: named("3"), at: 9000 });
    expect(history.future).toEqual([]);
    expect(historyReducer(history, { type: "redo" })).toBe(history);
  });

  it("merges fast typing in one field, but not other fields or slow edits", () => {
    let history = createHistory(named("0"));
    for (const [name, at] of [["a", 1000], ["ab", 1200], ["abc", 1400]] as const) {
      history = historyReducer(history, { type: "edit", document: named(name), key: "title", at });
    }
    expect(history.past).toHaveLength(1);
    history = historyReducer(history, { type: "edit", document: named("x"), key: "other", at: 1500 });
    expect(history.past).toHaveLength(2);
    history = historyReducer(history, { type: "edit", document: named("xy"), key: "other", at: 9000 });
    expect(history.past).toHaveLength(3);
  });

  it("does nothing at the ends of the history, and keeps its size bounded", () => {
    let history = createHistory(named("0"));
    expect(historyReducer(history, { type: "undo" })).toBe(history);
    for (let index = 1; index <= 150; index += 1) {
      history = historyReducer(history, { type: "edit", document: named(String(index)), at: index * 10_000 });
    }
    expect(history.past.length).toBe(100);
  });
});

describe("pages", () => {
  it("protects the homepage until another page replaces it", () => {
    const original = doc();
    expect(removePage(original, "home")).toBe(original);
    expect(setPageVisible(original, "home", false)).toBe(original);

    const replaced = setHomePage(setPageVisible(original, "about", false), "about");
    expect(replaced.pages.find((page) => page.isHome)?.id).toBe("about");
    expect(replaced.pages.find((page) => page.id === "about")?.isVisible).toBe(true);
    expect(replaced.pages.filter((page) => page.isHome)).toHaveLength(1);
    expect(removePage(replaced, "home").pages.map((page) => page.id)).toEqual(["about"]);
  });

  it("does not remove the last page", () => {
    const only = { ...doc(), pages: [{ ...doc().pages[1]!, isHome: false }] };
    expect(removePage(only, "about")).toBe(only);
  });

  it("creates unique slugs and ignores the page being renamed", () => {
    let document = doc();
    expect(uniquePageSlug(document, "about")).toBe("about-2");
    document = addPage(document, { ...document.pages[1]!, id: "x", slug: "about-2" });
    expect(uniquePageSlug(document, "about")).toBe("about-3");
    expect(uniquePageSlug(document, "about", "about")).toBe("about");
    expect(uniquePageSlug(document, "")).toBe("page");
  });

  it("reorders, ignoring out-of-range moves", () => {
    const document = doc();
    expect(movePage(document, 1, 0).pages.map((page) => page.id)).toEqual(["about", "home"]);
    expect(movePage(document, 0, 5).pages).toBe(document.pages);
  });
});

describe("sections", () => {
  const ids = (document: EditorDocument) => document.pages[0]!.sections.map((item) => item.id);

  it("reorders, inserts after a section, and removes", () => {
    expect(ids(moveSection(doc(), "home", 0, 2))).toEqual(["b", "c", "a"]);
    expect(ids(insertSection(doc(), "home", section("n"), "a"))).toEqual(["a", "n", "b", "c"]);
    expect(ids(insertSection(doc(), "home", section("n")))).toEqual(["a", "b", "c", "n"]);
    expect(ids(removeSection(doc(), "home", "b"))).toEqual(["a", "c"]);
  });

  it("duplicates as an independent copy with a new id", () => {
    const original = doc();
    const copied = duplicateSection(original, "home", "a", "a2");
    expect(ids(copied)).toEqual(["a", "a2", "b", "c"]);
    copied.pages[0]!.sections[1]!.props.heading = "changed";
    expect(copied.pages[0]!.sections[0]!.props.heading).toBe("a");
  });

  it("never mutates the previous document, so undo stays correct", () => {
    const original = doc();
    const snapshot = structuredClone(original);
    moveSection(original, "home", 0, 1);
    removeSection(original, "home", "a");
    setHomePage(original, "about");
    expect(original).toEqual(snapshot);
  });
});

describe("setPath", () => {
  it("sets nested values immutably", () => {
    const props = { items: [{ title: "a" }, { title: "b" }] };
    const next = setPath(props, ["items", 1, "title"], "z");
    expect(getPath(next, ["items", 1, "title"])).toBe("z");
    expect(props.items[1]!.title).toBe("b");
  });

  it("removes emptied optional fields and emptied objects, keeping arrays", () => {
    expect(setPath({ eyebrow: "x", heading: "h" }, ["eyebrow"], "")).toEqual({ heading: "h" });
    const button = { primaryButton: { label: "Go", href: "/x" } };
    const once = setPath(button, ["primaryButton", "label"], "");
    expect(once).toEqual({ primaryButton: { href: "/x" } });
    expect(setPath(once, ["primaryButton", "href"], "")).toEqual({});
    expect(setPath({ items: [] }, ["other"], "y")).toEqual({ items: [], other: "y" });
  });
});

describe("editorDocumentSchema", () => {
  const uuid = "11111111-1111-4111-8111-111111111111";
  const valid = () => ({
    name: "Site",
    businessName: null,
    design: {},
    pages: [{ id: uuid, title: "Home", slug: "home", isHome: true, isVisible: true, seo: {}, sections: [] }],
  });

  it("accepts a valid document", () => {
    expect(editorDocumentSchema.safeParse(valid()).success).toBe(true);
  });

  it("rejects a bad slug, id, color or font", () => {
    const cases = [
      (d: ReturnType<typeof valid>) => { d.pages[0]!.slug = "Bad Slug"; },
      (d: ReturnType<typeof valid>) => { d.pages[0]!.id = "not-a-uuid"; },
      (d: ReturnType<typeof valid>) => { Object.assign(d.design, { primary: "red;x:y" }); },
      (d: ReturnType<typeof valid>) => { Object.assign(d.design, { headingFont: "evil" }); },
      (d: ReturnType<typeof valid>) => { d.name = "  "; },
    ];
    for (const change of cases) {
      const document = valid();
      change(document);
      expect(editorDocumentSchema.safeParse(document).success).toBe(false);
    }
  });
});
