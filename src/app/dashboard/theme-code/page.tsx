import { Code2, Download, KeyRound } from "lucide-react";
import type { Metadata } from "next";
import { PageTitle } from "@/components/user/page-title";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listMyThemeCode } from "@/features/themes/queries";
import { requireUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Theme Code" };

const date = (value: string) => new Date(value).toLocaleDateString("en-IN", { dateStyle: "medium" });

// Themes whose source code an admin has shared with this customer.
export default async function ThemeCodePage() {
  await requireUser();
  const themes = await listMyThemeCode();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageTitle title="Theme Code" description="Download the source code of themes you have been given access to." />

      {themes.length === 0 ? (
        <Card className="flex flex-col items-center p-10 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary-light text-primary">
            <KeyRound className="size-6" aria-hidden />
          </span>
          <h2 className="mt-4 text-lg font-semibold">No theme code yet</h2>
          <p className="mt-1 max-w-md text-sm text-secondary-text">
            When our team gives you access to a theme&apos;s code, it will appear here with a download button. Contact support to ask for access.
          </p>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {themes.map((theme) => (
            <li key={theme.theme_id}>
              <Card className="flex h-full flex-col p-5">
                <div className="flex items-start gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                    <Code2 className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold">{theme.name}</h2>
                    <p className="text-sm text-secondary-text">
                      Shared {date(theme.granted_at)}
                      {theme.expires_at ? ` · available until ${date(theme.expires_at)}` : ""}
                    </p>
                  </div>
                </div>
                <p className="mt-4 flex-1 text-sm text-secondary-text">
                  A Next.js project with the theme&apos;s source, images and content. Run <code className="rounded bg-background px-1">pnpm install</code> and{" "}
                  <code className="rounded bg-background px-1">pnpm dev</code> to start it.
                </p>
                <a href={`/api/themes/${theme.theme_id}/code`} download className={cn(buttonVariants(), "mt-5 self-start")}>
                  <Download className="size-4" aria-hidden />
                  Download code
                </a>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
