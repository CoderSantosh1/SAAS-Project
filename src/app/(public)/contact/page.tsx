import { Mail, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
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
          <p className="text-sm text-secondary-text">
            The quickest way to reach us is a support request.{" "}
            <Link href="/dashboard/support" className="font-semibold text-primary hover:text-primary-hover">
              Sign in and send a request
            </Link>
            , and we will reply within one working day.
          </p>
        )}
      </Card>
    </div>
  );
}
