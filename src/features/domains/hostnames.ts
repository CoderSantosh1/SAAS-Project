import { z } from "zod";
import { LIVE_SITE_PREFIX } from "@/features/websites/urls";

// Custom domain helpers shared by the dashboard, the proxy and tests. No server code.

const HOSTNAME = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

// Accepts what people paste, like "https://www.Example.com/", and keeps the hostname.
export function normalizeHostname(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, "")
    .replace(/[/?#].*$/, "")
    .replace(/:\d+$/, "")
    .replace(/\.$/, "");
}

export function platformHost(siteUrl = process.env.NEXT_PUBLIC_SITE_URL) {
  try {
    return siteUrl ? new URL(siteUrl).hostname.toLowerCase() : "localhost";
  } catch {
    return "localhost";
  }
}

export const hostnameSchema = z
  .string()
  .transform(normalizeHostname)
  .pipe(
    z
      .string()
      .max(253, "That domain is too long.")
      .regex(HOSTNAME, "Enter a domain like www.yourbusiness.in")
      .refine((host) => host !== platformHost() && !host.endsWith(`.${platformHost()}`), "Use a domain you own, not this platform's address."),
  );

// The DNS target custom domains point to. Defaults to sites.<platform host>.
export function cnameTarget(siteUrl = process.env.NEXT_PUBLIC_SITE_URL, override = process.env.NEXT_PUBLIC_SITES_CNAME_TARGET) {
  return override || `sites.${platformHost(siteUrl)}`;
}

export type DnsRecord = { type: "CNAME" | "TXT"; name: string; value: string; purpose: string };

export function dnsRecords(hostname: string, token: string, target = cnameTarget()): DnsRecord[] {
  return [
    { type: "CNAME", name: hostname, value: target, purpose: "Points your domain at your website" },
    // The admin check (verifyDomain in features/admin/panel-actions.ts) looks for exactly this value.
    { type: "TXT", name: `_web-verify.${hostname}`, value: token, purpose: "Proves you own the domain" },
  ];
}

// True for requests to the platform itself, which the proxy must never re-route.
export function isPlatformRequest(host: string | null, siteUrl = process.env.NEXT_PUBLIC_SITE_URL) {
  if (!host) return true;
  const name = host.toLowerCase().replace(/:\d+$/, "");
  const platform = platformHost(siteUrl);
  return (
    name === platform ||
    name === `www.${platform}` ||
    name === "localhost" ||
    name === "127.0.0.1" ||
    name === "[::1]" ||
    name.endsWith(".localhost") ||
    name.endsWith(".vercel.app")
  );
}

// The internal path a custom domain request is served from. Links inside a live site
// already carry the /sites/<slug> prefix, so those pass through unchanged.
export function customDomainPath(slug: string, pathname: string) {
  const prefix = `${LIVE_SITE_PREFIX}/${slug}`;
  if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return pathname;
  return pathname === "/" ? prefix : `${prefix}${pathname}`;
}
