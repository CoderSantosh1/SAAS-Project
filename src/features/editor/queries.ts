import "server-only";
import { createClient } from "@/lib/supabase/server";
import { editorDocumentSchema, type EditorData } from "./types";

// Owner only: the database function returns nothing for anyone else, including admins.
export async function getEditorData(websiteId: string): Promise<EditorData | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_website_editor", { p_website_id: websiteId });
  if (error) throw new Error(`Could not load the editor: ${error.message}`);
  if (!data) return null;

  const editor = data as EditorData;
  return { ...editor, document: editorDocumentSchema.parse(editor.document) };
}
