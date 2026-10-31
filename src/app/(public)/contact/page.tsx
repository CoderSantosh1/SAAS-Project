import { Mail } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader, PUBLIC_CONTAINER } from "@/components/public/page-header";
import { Card } from "@/components/ui/card";
import { getContactEmail } from "@/features/marketplace/queries";

export const metadata: Metadata = { title: "Contact" };
export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const email = await getContactEmail();

  return (
    <div className={`${PUBLIC_CONTAINER} py-14 sm:py-20`}>
      <PageHeader title="Contact us" description="Questions, feedback or a problem with your website? We would like to hear from you." />
      <Card className="mt-8 max-w-xl p-6">
        {email ? (
          <a href={`mailto:${email}`} className="flex items-center gap-3 font-medium text-primary hover:text-primary-hover">
            <Mail className="size-5" aria-hidden />
            {email}
          </a>
        ) : (
          <p className="text-sm text-secondary-text">Our contact details will be available here soon.</p>
        )}
      </Card>
    </div>
  );
}
