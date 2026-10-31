import { z } from "zod";
import { imageUrlSchema } from "@/themes/types";

const optionalText = (max: number) =>
  z.string().trim().max(max).transform((value) => value || undefined).optional();

// Mirrors public.is_valid_subdomain, which also rejects reserved names.
export const subdomainSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])$/, "Use 3 to 63 lowercase letters, numbers or hyphens. It cannot start or end with a hyphen.");

export const websiteBasicsSchema = z.object({
  name: z.string().trim().min(1, "Enter a website name").max(120),
  slug: subdomainSchema,
  businessName: optionalText(120),
  description: optionalText(500),
});

export const createWebsiteSchema = websiteBasicsSchema.extend({
  themeSlug: z.string().regex(/^[a-z0-9-]+$/).max(80),
  categorySlug: z.string().regex(/^[a-z0-9-]+$/).max(80).optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Choose a valid color").optional(),
  logoUrl: imageUrlSchema.optional(),
  email: z.union([z.literal(""), z.email("Enter a valid email address")]).optional(),
  phone: z
    .union([z.literal(""), z.string().trim().regex(/^[+\d][\d\s()-]{2,29}$/, "Enter a valid phone number")])
    .optional(),
  address: optionalText(200),
});

export type WebsiteBasicsValues = z.input<typeof websiteBasicsSchema>;
export type CreateWebsiteValues = z.input<typeof createWebsiteSchema>;

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
    .replace(/-+$/, "");
}
