// Accepts only same-site paths, so a crafted ?next= cannot redirect off-site.
export function safeNextPath(value: unknown, fallback = "/dashboard") {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\s]/.test(value)
  ) {
    return fallback;
  }
  return value;
}

export type RouteAccess = "public" | "guest" | "user" | "admin" | "admin-login";

function isUnder(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function classifyRoute(pathname: string): RouteAccess {
  if (isUnder(pathname, "/admin/login")) return "admin-login";
  if (isUnder(pathname, "/admin")) return "admin";
  if (isUnder(pathname, "/dashboard") || isUnder(pathname, "/editor")) return "user";
  if (isUnder(pathname, "/login") || isUnder(pathname, "/register")) return "guest";
  return "public";
}
