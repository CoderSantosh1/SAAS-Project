import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ThemePreview } from "@/components/public/theme-preview";
import { Card } from "@/components/ui/card";
import { ActivateVersionButton, ThemeActions } from "@/features/themes/components/theme-actions";
import { EditThemeForm, NewVersionForm } from "@/features/themes/components/theme-forms";
import { ThemeStatusBadge } from "@/features/themes/components/theme-status-badge";
import { ThemeCodeAccess } from "@/features/themes/components/theme-code-access";
import { getAdminTheme, listCategoryOptions, listThemeCodeGrants } from "@/features/themes/queries";
import { requireAdmin } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { getTheme } from "@/themes/registry";

export const metadata: Metadata = { title: "Manage theme" };

export default async function ManageThemePage({
  params,
  searchParams,
}: {
  params: Promise<{ themeId: string }>;
  searchParams: Promise<{ uploaded?: string }>;
}) {
  const { access } = await requireAdmin("themes.manage");
  const canDownload = can(access, "themes.download_code");
  const { themeId } = await params;
  if (!z.uuid().safeParse(themeId).success) notFound();

  const [theme, categories, { uploaded }, grants] = await Promise.all([
    getAdminTheme(themeId),
    listCategoryOptions(),
    searchParams,
    canDownload ? listThemeCodeGrants(themeId) : Promise.resolve([]),
  ]);
  if (!theme) notFound();

  const active = theme.versions.find((version) => version.id === theme.current_version_id);
  const hasSource = Boolean(active && getTheme(active.component_id, active.component_version));
  const reviewSrc = theme.current_version_id ? `/preview/admin-themes/${theme.current_version_id}` : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/admin/themes" className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary-text hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        Themes
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{theme.name}</h1>
        <ThemeStatusBadge status={theme.status} />
        <span className="text-sm text-secondary-text">
          Used by {theme.website_count} {theme.website_count === 1 ? "website" : "websites"}
        </span>
      </div>

      {uploaded === "1" && (
        <p role="status" className="rounded-md bg-success/10 px-4 py-3 text-sm text-green-800">
          The package passed all checks. Review the theme below, then publish it when ready.
        </p>
      )}

      <ThemeActions theme={theme} />

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Review</h2>
          {reviewSrc && (
            <a href={reviewSrc} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-hover hover:underline">
              Open full preview
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          )}
        </div>
        {reviewSrc ? (
          <ThemePreview src={reviewSrc} title={theme.name} />
        ) : (
          <Card className="p-8 text-center text-sm text-secondary-text">This theme has no version yet. Upload one below.</Card>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Versions</h2>
        <Card className="relative overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border text-xs font-semibold text-secondary-text">
              <tr>
                <th scope="col" className="px-4 py-3">Version</th>
                <th scope="col" className="px-4 py-3">Approved component</th>
                <th scope="col" className="px-4 py-3">Websites</th>
                <th scope="col" className="px-4 py-3">Uploaded</th>
                <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {theme.versions.map((version) => (
                <tr key={version.id}>
                  <td className="px-4 py-3">
                    <span className="font-semibold">{version.version}</span>
                    {version.id === theme.current_version_id && (
                      <span className="ml-2 rounded-full bg-primary-light px-2 py-0.5 text-xs font-semibold text-primary-hover">Active</span>
                    )}
                    {version.changelog && <p className="mt-0.5 text-xs text-secondary-text">{version.changelog}</p>}
                  </td>
                  <td className="px-4 py-3 text-secondary-text">
                    {version.component_id} {version.component_version}
                  </td>
                  <td className="px-4 py-3 text-secondary-text">{version.website_count}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-secondary-text">
                    {new Date(version.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <a href={`/preview/admin-themes/${version.id}`} target="_blank" rel="noopener" className="mr-1 rounded-md px-2 py-1 text-sm font-semibold text-secondary-text hover:bg-background">
                      Preview
                    </a>
                    {version.id !== theme.current_version_id && <ActivateVersionButton themeId={theme.id} version={version} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {theme.versions.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-secondary-text">No versions yet.</p>
          )}
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold">Upload a new version</h3>
          <NewVersionForm themeId={theme.id} />
        </Card>
      </section>

      {canDownload && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Source code</h2>
          <Card className="p-5">
            <ThemeCodeAccess themeId={theme.id} grants={grants} available={hasSource} />
          </Card>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Details</h2>
        <Card className="p-6">
          <EditThemeForm theme={theme} categories={categories} />
        </Card>
      </section>
    </div>
  );
}
