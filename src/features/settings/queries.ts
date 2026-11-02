import "server-only";
import { cache } from "react";
import { brand } from "@/config/brand";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";

export type PlatformSettings = {
  name: string;
  logoUrl: string;
  faviconUrl: string;
  seoTitle: string;
  seoDescription: string;
  contactEmail: string;
  contactPhone: string;
  social: { label: string; url: string }[];
  registrationsOpen: boolean;
  maintenanceMode: boolean;
};

const text = (value: unknown) => (typeof value === "string" ? value : "");

// The site must still work if settings cannot be read, so failures give the defaults.
export const getPlatformSettings = cache(async (): Promise<PlatformSettings> => {
  const values = new Map<string, unknown>();

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await createPublicClient().from("platform_settings").select("key, value").eq("is_public", true);
      if (error) throw error;
      for (const row of data ?? []) values.set(row.key, row.value);
    } catch (error) {
      console.error("Could not load platform settings", error);
    }
  }

  return {
    name: text(values.get("platform.name")) || brand.name,
    logoUrl: text(values.get("platform.logo_url")),
    faviconUrl: text(values.get("platform.favicon_url")),
    seoTitle: text(values.get("seo.title")),
    seoDescription: text(values.get("seo.description")),
    contactEmail: text(values.get("contact.email")),
    contactPhone: text(values.get("contact.phone")),
    social: [
      { label: "Facebook", url: text(values.get("social.facebook")) },
      { label: "Instagram", url: text(values.get("social.instagram")) },
      { label: "X", url: text(values.get("social.x")) },
      { label: "LinkedIn", url: text(values.get("social.linkedin")) },
    ].filter((link) => link.url),
    registrationsOpen: values.get("feature.registrations_open") !== false,
    maintenanceMode: values.get("platform.maintenance_mode") === true,
  };
});
