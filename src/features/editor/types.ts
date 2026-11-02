import { z } from "zod";
import { FONT_IDS, sectionDesignSchema } from "@/themes/types";

const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(80);

// Section props stay loosely typed while saving, because a section can be mid-edit
// (a heading briefly empty). They are validated by type wherever they are rendered.
export const editorSectionSchema = z.object({
  id: z.uuid(),
  type: z.string().min(1).max(40),
  props: z.record(z.string(), z.unknown()),
  design: sectionDesignSchema.catch({}),
  isVisible: z.boolean(),
});

export const editorPageSchema = z.object({
  id: z.uuid(),
  title: z.string().trim().min(1).max(120),
  slug,
  isHome: z.boolean(),
  isVisible: z.boolean(),
  seo: z.object({
    title: z.string().max(120).optional(),
    description: z.string().max(300).optional(),
  }),
  sections: z.array(editorSectionSchema).max(100),
});

export const siteDesignSchema = z.object({
  primary: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  logoUrl: z.string().max(2048).optional(),
  headingFont: z.enum(FONT_IDS).optional(),
  bodyFont: z.enum(FONT_IDS).optional(),
  radius: z.enum(["none", "md", "lg"]).optional(),
});

export const editorDocumentSchema = z.object({
  name: z.string().trim().min(1).max(120),
  businessName: z.string().trim().max(120).nullable(),
  design: siteDesignSchema,
  pages: z.array(editorPageSchema).min(1).max(50),
});

export type EditorSection = z.infer<typeof editorSectionSchema>;
export type EditorPage = z.infer<typeof editorPageSchema>;
export type EditorDocument = z.infer<typeof editorDocumentSchema>;
export type SiteDesign = z.infer<typeof siteDesignSchema>;

export type EditorData = {
  id: string;
  slug: string;
  status: string;
  revision: number;
  component_id: string | null;
  version: string | null;
  design_tokens: unknown;
  document: EditorDocument;
};

export type VersionSummary = {
  id: string;
  version_number: number;
  label: string | null;
  created_at: string;
};
