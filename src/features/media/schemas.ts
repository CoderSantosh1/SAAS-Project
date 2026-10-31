import { z } from "zod";

// Must match the limits on the user-media bucket. SVG is left out on purpose,
// because an SVG file can contain scripts.
export const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
] as const;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export const mediaRecordSchema = z.object({
  path: z.string().regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.[a-z]+$/),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.enum(ALLOWED_IMAGE_TYPES),
  sizeBytes: z.number().int().positive().max(MAX_IMAGE_BYTES),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export type MediaRecordValues = z.infer<typeof mediaRecordSchema>;
