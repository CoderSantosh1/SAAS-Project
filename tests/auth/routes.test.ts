import { describe, expect, it } from "vitest";
import { classifyRoute, safeNextPath } from "@/lib/auth/routes";

describe("safeNextPath", () => {
  it("keeps same-site paths", () => {
    expect(safeNextPath("/dashboard/websites?x=1")).toBe("/dashboard/websites?x=1");
  });

  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    "/foo bar",
    "",
    undefined,
    null,
    ["/dashboard"],
  ])("falls back for %j", (value) => {
    expect(safeNextPath(value)).toBe("/dashboard");
  });
});

describe("classifyRoute", () => {
  it.each([
    ["/", "public"],
    ["/administrator", "public"],
    ["/dashboard-tips", "public"],
    ["/login", "guest"],
    ["/register", "guest"],
    ["/dashboard", "user"],
    ["/dashboard/websites", "user"],
    ["/editor/123", "user"],
    ["/admin", "admin"],
    ["/admin/users", "admin"],
    ["/admin/forbidden", "admin"],
    ["/admin/login", "admin-login"],
  ])("%s is %s", (path, expected) => {
    expect(classifyRoute(path)).toBe(expected);
  });
});
