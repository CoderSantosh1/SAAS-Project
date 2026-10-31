"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { FormField, FormStatus } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { updateWebsite, type ActionResult } from "../actions";
import type { WebsiteDetails } from "../queries";
import { websiteBasicsSchema, type WebsiteBasicsValues } from "../schemas";

export function WebsiteSettingsForm({ website }: { website: WebsiteDetails }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult>({});
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WebsiteBasicsValues>({
    resolver: zodResolver(websiteBasicsSchema),
    defaultValues: {
      name: website.name,
      slug: website.slug,
      businessName: website.business_name ?? "",
      description: website.description ?? "",
    },
  });

  const onSubmit = (values: WebsiteBasicsValues) => {
    setResult({});
    startTransition(async () => {
      try {
        setResult(await updateWebsite(website.id, values));
      } catch {
        setResult({ error: "Something went wrong. Please try again." });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} method="post" className="space-y-4" noValidate>
      <FormStatus result={result} />
      <FormField label="Website name" error={errors.name} {...register("name")} />
      <FormField
        label="Web address"
        hint="Lowercase letters, numbers and hyphens."
        error={errors.slug}
        {...register("slug")}
      />
      <FormField label="Business name" hint="Shown at the top of your website." error={errors.businessName} {...register("businessName")} />
      <FormField label="Description" error={errors.description} {...register("description")} />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
