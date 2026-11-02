import { z } from "zod";

const optionalText = (max: number) =>
  z.string().trim().max(max).transform((value) => value || null).nullable().optional();

const optionalUrl = z
  .union([z.literal(""), z.url("Enter a full address starting with https://").refine((value) => /^https?:\/\//i.test(value), "Enter a full address starting with https://")])
  .nullable()
  .optional()
  .transform((value) => value || null);

export const themeDetailsSchema = z.object({
  name: z.string().trim().min(1, "Enter a theme name").max(120),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens.")
    .max(80),
  description: optionalText(500),
  categoryId: z.union([z.literal(""), z.uuid()]).nullable().optional().transform((value) => value || null),
  isPremium: z.boolean(),
  isFeatured: z.boolean(),
  authorName: optionalText(120),
  authorUrl: optionalUrl,
  supportedFeatures: z.array(z.string().trim().min(1).max(40)).max(30),
  previewUrl: optionalUrl,
  thumbnailUrl: optionalUrl,
  desktopPreviewUrl: optionalUrl,
  mobilePreviewUrl: optionalUrl,
});

export const versionNumberSchema = z
  .string()
  .trim()
  .regex(/^\d+\.\d+\.\d+$/, "Use a version like 1.0.0.");

export const packagePathSchema = z.string().regex(/^uploads\/[0-9a-f-]{36}\.zip$/);

export type ThemeDetailsValues = z.input<typeof themeDetailsSchema>;
