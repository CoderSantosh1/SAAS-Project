import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Editor } from "@/features/editor/components/editor";
import { getEditorData } from "@/features/editor/queries";
import { requireUser } from "@/lib/auth/session";
import { getTheme } from "@/themes/registry";
import { siteFontClassName } from "@/themes/shared/fonts";

export const metadata: Metadata = { title: "Editor", robots: { index: false } };

export default async function EditorPage({ params }: { params: Promise<{ websiteId: string }> }) {
  await requireUser();
  const { websiteId } = await params;
  if (!z.uuid().safeParse(websiteId).success) notFound();

  const data = await getEditorData(websiteId);
  if (!data?.component_id || !data.version || !getTheme(data.component_id, data.version)) notFound();

  return <Editor data={data} fontClassName={siteFontClassName} />;
}
