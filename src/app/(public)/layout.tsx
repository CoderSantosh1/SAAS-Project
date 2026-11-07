import { Wrench } from "lucide-react";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getPlatformSettings } from "@/features/settings/queries";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const settings = await getPlatformSettings();

  if (settings.maintenanceMode) {
    return (
      <main className="ui-glass flex min-h-dvh flex-col items-center justify-center gap-3 px-4 text-center">
        <Wrench className="size-10 text-accent" aria-hidden />
        <h1 className="text-2xl font-semibold">{settings.name} is under maintenance</h1>
        <p className="max-w-md text-sm text-secondary-text">We will be back shortly. Thank you for your patience.</p>
      </main>
    );
  }

  return (
    <div className="ui-glass flex min-h-dvh flex-col">
      <SiteHeader name={settings.name} logoUrl={settings.logoUrl} registrationsOpen={settings.registrationsOpen} />
      <main className="flex-1">{children}</main>
      <SiteFooter name={settings.name} tagline="Your Website. Your Vision." social={settings.social} />
    </div>
  );
}
