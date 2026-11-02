import { strToU8, zipSync } from "fflate";
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { getThemeDefinitionBySlug } from "@/themes/registry";

// A correct package to start from: one approved component's own tokens and content.
export async function GET(request: NextRequest) {
  await requireAdmin("themes.manage");

  const definition = getThemeDefinitionBySlug(request.nextUrl.searchParams.get("component") ?? "");
  if (!definition) return new NextResponse("Unknown component", { status: 404 });

  const manifest = {
    schemaVersion: 1,
    component: { id: definition.componentId, version: definition.version },
    tokens: definition.tokens,
    pages: definition.pages,
  };
  const zip = zipSync({ "theme.json": strToU8(JSON.stringify(manifest, null, 2)) });

  return new NextResponse(Buffer.from(zip), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${definition.slug}-starter.zip"`,
    },
  });
}
