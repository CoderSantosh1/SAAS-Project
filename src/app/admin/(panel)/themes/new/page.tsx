import { ArrowLeft, Download } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { UploadThemeForm } from "@/features/themes/components/theme-forms";
import { listCategoryOptions } from "@/features/themes/queries";
import { requireAdmin } from "@/lib/auth/session";
import { listThemeDefinitions } from "@/themes/registry";

export const metadata: Metadata = { title: "Upload theme" };

export default async function UploadThemePage() {
  await requireAdmin("themes.manage");
  const categories = await listCategoryOptions();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/admin/themes" className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary-text hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        Themes
      </Link>
      <div>
        <h1 className="text-2xl font-semibold">Upload New Theme</h1>
        <p className="mt-1 text-sm text-secondary-text">
          The theme goes to review first. Nothing reaches the marketplace until you publish it.
        </p>
      </div>

      <Card className="space-y-2 p-5 text-sm">
        <h2 className="font-semibold">What a package can contain</h2>
        <p className="text-secondary-text">
          A ZIP with <code>theme.json</code> at the top level, plus images in an <code>assets</code> folder. Code files are
          refused and never run. A package sets its colors, fonts and content, and uses the layout of an approved component.
          A completely new layout has to be added to the product by a developer.
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
          <span className="font-medium">Download a starter package:</span>
          {listThemeDefinitions().map((definition) => (
            <a
              key={definition.slug}
              href={`/admin/themes/starter-package?component=${definition.slug}`}
              className="inline-flex items-center gap-1 font-semibold text-primary-hover hover:underline"
            >
              <Download className="size-3.5" aria-hidden />
              {definition.name}
            </a>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <UploadThemeForm categories={categories} />
      </Card>
    </div>
  );
}
