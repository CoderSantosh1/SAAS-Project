import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? sourceFiles(path) : path.endsWith(".tsx") ? [path] : [];
  });
}

describe("client forms", () => {
  // A form handled by JavaScript can still be submitted natively before the page has
  // hydrated. Without method="post" the browser would put its fields, including
  // passwords, in the URL.
  it("all use POST when handled by onSubmit", () => {
    const offenders = sourceFiles(join(process.cwd(), "src")).flatMap((file) => {
      const forms = readFileSync(file, "utf8").match(/<form\b[^\n]*onSubmit[^\n]*/g) ?? [];
      return forms.filter((form) => !form.includes('method="post"')).map(() => file);
    });
    expect(offenders).toEqual([]);
  });
});
