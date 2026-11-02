import { Mail, Phone } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader, PUBLIC_CONTAINER } from "@/components/public/page-header";
import { Card } from "@/components/ui/card";
import { getPlatformSettings } from "@/features/settings/queries";

export const metadata: Metadata = { title: "Contact" };
export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const { contactEmail, contactPhone } = await getPlatformSettings();

  return (
    <div className={`${PUBLIC_CONTAINER} py-14 sm:py-20`}>
      <PageHeader title="Contact us" description="Questions, feedback or a problem with your website? We would like to hear from you." />
      <Card className="mt-8 max-w-xl space-y-3 p-6">
        {contactEmail && (
          <a href={`mailto:${contactEmail}`} className="flex items-center gap-3 font-medium text-primary hover:text-primary-hover">
            <Mail className="size-5" aria-hidden />
            {contactEmail}
          </a>
        )}
        {contactPhone && (
          <a href={`tel:${contactPhone.replace(/[^+\d]/g, "")}`} className="flex items-center gap-3 font-medium text-primary hover:text-primary-hover">
            <Phone className="size-5" aria-hidden />
            {contactPhone}
          </a>
        )}
        {!contactEmail && !contactPhone && (
          <p className="text-sm text-secondary-text">Our contact details will be available here soon.</p>
        )}
      </Card>
    </div>
  );
}
