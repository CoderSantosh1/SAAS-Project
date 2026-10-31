"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { FormField, FormStatus } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { uploadImage } from "@/features/media/upload";
import { checkSubdomain, createWebsite, type ActionResult } from "../actions";
import { createWebsiteSchema, slugify, type CreateWebsiteValues } from "../schemas";

export function CreateWebsiteForm({
  themeSlug,
  categorySlug,
  defaultColor,
  categories,
}: {
  themeSlug: string;
  categorySlug?: string;
  defaultColor: string;
  categories: { name: string; slug: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult>({});
  const [availability, setAvailability] = useState<"checking" | "available" | "taken">();
  const [logoStatus, setLogoStatus] = useState<string>();
  const [slugEdited, setSlugEdited] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    setError,
    formState: { errors },
  } = useForm<CreateWebsiteValues>({
    resolver: zodResolver(createWebsiteSchema),
    defaultValues: {
      themeSlug,
      categorySlug: categorySlug ?? categories[0]?.slug,
      primaryColor: defaultColor.toLowerCase(),
      name: "",
      slug: "",
    },
  });

  const checkAvailability = async () => {
    const slug = getValues("slug");
    if (!createWebsiteSchema.shape.slug.safeParse(slug).success) {
      setAvailability(undefined);
      return;
    }
    setAvailability("checking");
    try {
      setAvailability((await checkSubdomain(slug)) ? "available" : "taken");
    } catch {
      setAvailability(undefined);
    }
  };

  const onLogoChange = async (file?: File) => {
    if (!file) return;
    setLogoStatus("Uploading...");
    try {
      const uploaded = await uploadImage(file);
      setValue("logoUrl", uploaded.url);
      setLogoStatus(uploaded.error ?? `${file.name} uploaded`);
    } catch {
      setValue("logoUrl", undefined);
      setLogoStatus("We could not upload that image. Please try again.");
    }
  };

  const onSubmit = (values: CreateWebsiteValues) => {
    setResult({});
    startTransition(async () => {
      try {
        if (!(await checkSubdomain(values.slug))) {
          setAvailability("taken");
          setError("slug", { message: "That web address is not available. Please choose another." });
          return;
        }
        setResult(await createWebsite(values));
      } catch {
        setResult({ error: "Something went wrong. Please try again." });
      }
    });
  };

  const nameField = register("name", {
    onChange: (event) => {
      if (!slugEdited) {
        setValue("slug", slugify(event.target.value));
        setAvailability(undefined);
      }
    },
    onBlur: () => {
      if (!slugEdited) void checkAvailability();
    },
  });
  const slugField = register("slug", {
    onChange: () => {
      setSlugEdited(true);
      setAvailability(undefined);
    },
    onBlur: () => void checkAvailability(),
  });

  const availabilityHint = {
    checking: "Checking...",
    available: "This address is available.",
    taken: "This address is not available.",
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} method="post" className="space-y-4" noValidate>
      <FormStatus result={result} />
      <FormField label="Website name" error={errors.name} {...nameField} />
      <FormField
        label="Web address"
        hint={availability ? availabilityHint[availability] : "Lowercase letters, numbers and hyphens."}
        error={errors.slug}
        {...slugField}
      />
      <FormField label="Business name" hint="Shown at the top of your website. Optional." error={errors.businessName} {...register("businessName")} />
      <FormField label="Website description" hint="Optional." error={errors.description} {...register("description")} />

      {categories.length > 0 && (
        <div className="space-y-1.5">
          <label htmlFor="categorySlug" className="block text-sm font-medium text-foreground">
            Category
          </label>
          <select
            id="categorySlug"
            {...register("categorySlug")}
            className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground"
          >
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="primaryColor" className="block text-sm font-medium text-foreground">
            Primary color
          </label>
          <input
            id="primaryColor"
            type="color"
            defaultValue={defaultColor.toLowerCase()}
            {...register("primaryColor")}
            className="h-10 w-full cursor-pointer rounded-md border border-border bg-surface p-1"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="logo" className="block text-sm font-medium text-foreground">
            Logo (optional)
          </label>
          <input
            id="logo"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
            onChange={(event) => void onLogoChange(event.target.files?.[0])}
            className="block w-full text-sm text-secondary-text file:mr-3 file:h-10 file:cursor-pointer file:rounded-md file:border file:border-border file:bg-surface file:px-3 file:text-sm file:font-semibold file:text-foreground"
          />
          {logoStatus && <p role="status" className="text-sm text-secondary-text">{logoStatus}</p>}
        </div>
      </div>

      <fieldset className="space-y-4 border-t border-border pt-4">
        <legend className="pr-2 text-sm font-semibold">Contact details (optional)</legend>
        <FormField label="Email" type="email" autoComplete="email" error={errors.email} {...register("email")} />
        <FormField label="Phone" type="tel" autoComplete="tel" error={errors.phone} {...register("phone")} />
        <FormField label="Address" autoComplete="street-address" error={errors.address} {...register("address")} />
      </fieldset>

      <Button type="submit" size="lg" className="w-full" disabled={pending || logoStatus === "Uploading..."}>
        {pending ? "Creating your website..." : "Create website"}
      </Button>
    </form>
  );
}
