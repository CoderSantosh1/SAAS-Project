import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { brand } from "@/config/brand";

export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <Link href="/" className="mb-6 font-heading text-2xl font-bold text-primary">
        {brand.name}
      </Link>
      <Card className="w-full max-w-md p-6 sm:p-8">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-secondary-text">{description}</p>}
        <div className="mt-6">{children}</div>
      </Card>
      {footer && <div className="mt-5 text-sm text-secondary-text">{footer}</div>}
    </main>
  );
}
