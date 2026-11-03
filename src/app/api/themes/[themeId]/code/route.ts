import { z } from "zod";
import { buildThemeCodePackage, type CodeDownload } from "@/features/themes/code-package";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "private, no-store" };

// Downloads a theme's source package. The database decides who may download, for admins
// with the permission and for customers an admin gave access, and records each download.
export async function GET(_request: Request, { params }: { params: Promise<{ themeId: string }> }) {
  const { themeId } = await params;
  if (!z.uuid().safeParse(themeId).success) return new Response("Not found", { status: 404, headers: NO_STORE });

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new Response("Sign in to download theme code.", { status: 401, headers: NO_STORE });

  const { data, error } = await supabase.rpc("begin_theme_code_download", { p_theme_id: themeId });
  if (error) {
    const status = error.code === "42501" ? 403 : error.code === "P0002" ? 404 : 500;
    const message = status === 500 ? "We could not prepare this download." : error.message;
    return new Response(message, { status, headers: NO_STORE });
  }

  const built = buildThemeCodePackage(data as CodeDownload);
  if (!built) return new Response("This theme's source code is not available.", { status: 404, headers: NO_STORE });

  return new Response(built.bytes as BodyInit, {
    headers: {
      ...NO_STORE,
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${built.filename}"`,
      "Content-Length": String(built.bytes.byteLength),
    },
  });
}
