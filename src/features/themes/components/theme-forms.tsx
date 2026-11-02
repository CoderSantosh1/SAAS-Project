"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm, type UseFormRegister, type FieldErrors } from "react-hook-form";
import { FormField, FormStatus } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { slugify } from "@/features/websites/schemas";
import {
  registerThemeUpload,
  updateThemeDetails,
  uploadThemeVersion,
  type ThemeActionResult,
} from "../actions";
import type { AdminTheme, CategoryOption } from "../queries";
import { themeDetailsSchema, versionNumberSchema, type ThemeDetailsValues } from "../schemas";
import { uploadPackageFile, uploadThemeImage } from "./theme-upload";

function ErrorList({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <div role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-red-800">
      <p className="font-semibold">This package was not accepted, and nothing was saved:</p>
      <ul className="mt-1 list-disc space-y-0.5 pl-5">
        {errors.map((error) => (
          <li key={error} className="break-words">
            {error}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string | null;
  onChange: (url: string | null) => void;
}) {
  const [status, setStatus] = useState<string>();
  const id = label.toLowerCase().replaceAll(" ", "-");

  const onFile = async (file?: File) => {
    if (!file) return;
    setStatus("Uploading...");
    try {
      const result = await uploadThemeImage(file);
      if (result.url) onChange(result.url);
      setStatus(result.error ?? "Uploaded");
    } catch {
      setStatus("We could not upload that image. Please try again.");
    }
  };

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="h-24 w-full rounded-md border border-border bg-background object-contain" />
      )}
      <input
        id={id}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(event) => void onFile(event.target.files?.[0])}
        className="block w-full text-sm text-secondary-text file:mr-3 file:h-9 file:cursor-pointer file:rounded-md file:border file:border-border file:bg-surface file:px-3 file:text-sm file:font-semibold file:text-foreground"
      />
      {status && (
        <p role="status" className="text-xs text-secondary-text">
          {status}
        </p>
      )}
      {value && (
        <button type="button" className="text-xs font-semibold text-danger" onClick={() => onChange(null)}>
          Remove image
        </button>
      )}
    </div>
  );
}

function DetailsFields({
  register,
  errors,
  categories,
  features,
  setFeatures,
  nameField,
  slugField,
}: {
  register: UseFormRegister<ThemeDetailsValues>;
  errors: FieldErrors<ThemeDetailsValues>;
  categories: CategoryOption[];
  features: string;
  setFeatures: (value: string) => void;
  nameField?: ReturnType<UseFormRegister<ThemeDetailsValues>>;
  slugField?: ReturnType<UseFormRegister<ThemeDetailsValues>>;
}) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Theme name" error={errors.name} {...(nameField ?? register("name"))} />
        <FormField label="Theme slug" hint="Used in its web address." error={errors.slug} {...(slugField ?? register("slug"))} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="description" className="block text-sm font-medium text-foreground">
          Description
        </label>
        <textarea
          id="description"
          rows={3}
          {...register("description")}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="categoryId" className="block text-sm font-medium text-foreground">
            Category
          </label>
          <select
            id="categoryId"
            {...register("categoryId")}
            className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground"
          >
            <option value="">Choose a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <p className="text-sm text-secondary-text">Required before publishing.</p>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="features" className="block text-sm font-medium text-foreground">
            Supported features
          </label>
          <input
            id="features"
            value={features}
            onChange={(event) => setFeatures(event.target.value)}
            placeholder="responsive, gallery, menu"
            className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground"
          />
          <p className="text-sm text-secondary-text">Separate with commas.</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Author or creator" error={errors.authorName} {...register("authorName")} />
        <FormField label="Author website" placeholder="https://" error={errors.authorUrl} {...register("authorUrl")} />
      </div>
      <FormField label="Theme preview URL" hint="Optional external demo." placeholder="https://" error={errors.previewUrl} {...register("previewUrl")} />
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" {...register("isPremium")} className="size-4 accent-primary" />
          Premium theme
        </label>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" {...register("isFeatured")} className="size-4 accent-primary" />
          Featured
        </label>
      </div>
    </>
  );
}

const featureList = (value: string) => [
  ...new Set(
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  ),
];

export function UploadThemeForm({ categories }: { categories: CategoryOption[] }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ThemeActionResult>({});
  const [progress, setProgress] = useState<string>();
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>();
  const [version, setVersion] = useState("1.0.0");
  const [versionError, setVersionError] = useState<string>();
  const [features, setFeatures] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [desktop, setDesktop] = useState<string | null>(null);
  const [mobile, setMobile] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ThemeDetailsValues>({
    resolver: zodResolver(themeDetailsSchema),
    defaultValues: { name: "", slug: "", isPremium: false, isFeatured: false, supportedFeatures: [] },
  });

  const nameField = register("name", {
    onChange: (event) => {
      if (!slugEdited) setValue("slug", slugify(event.target.value));
    },
  });
  const slugField = register("slug", { onChange: () => setSlugEdited(true) });

  const onSubmit = (details: ThemeDetailsValues) => {
    setResult({});
    const versionOk = versionNumberSchema.safeParse(version).success;
    setVersionError(versionOk ? undefined : "Use a version like 1.0.0.");
    setFileError(file ? undefined : "Choose a ZIP package.");
    if (!versionOk || !file) return;

    startTransition(async () => {
      try {
        setProgress("Uploading package...");
        const upload = await uploadPackageFile(file);
        if (!upload.path) {
          setResult({ error: upload.error });
          return;
        }
        setProgress("Checking package...");
        setResult(
          await registerThemeUpload({
            packagePath: upload.path,
            version,
            details: {
              ...details,
              supportedFeatures: featureList(features),
              thumbnailUrl: thumbnail,
              desktopPreviewUrl: desktop,
              mobilePreviewUrl: mobile,
            },
          }),
        );
      } catch {
        setResult({ error: "Something went wrong. Please try again." });
      } finally {
        setProgress(undefined);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} method="post" className="space-y-5" noValidate>
      <FormStatus result={{ error: result.error }} />
      <ErrorList errors={result.errors} />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="package" className="block text-sm font-medium text-foreground">
            Theme package (ZIP, up to 25 MB)
          </label>
          <input
            id="package"
            type="file"
            accept=".zip,application/zip"
            aria-invalid={fileError ? true : undefined}
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setFileError(undefined);
            }}
            className="block w-full text-sm text-secondary-text file:mr-3 file:h-10 file:cursor-pointer file:rounded-md file:border file:border-border file:bg-surface file:px-3 file:text-sm file:font-semibold file:text-foreground"
          />
          {fileError && <p className="text-sm text-danger">{fileError}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="version" className="block text-sm font-medium text-foreground">
            Theme version
          </label>
          <input
            id="version"
            value={version}
            onChange={(event) => setVersion(event.target.value)}
            aria-invalid={versionError ? true : undefined}
            className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground aria-invalid:border-danger"
          />
          {versionError && <p className="text-sm text-danger">{versionError}</p>}
        </div>
      </div>

      <DetailsFields
        register={register}
        errors={errors}
        categories={categories}
        features={features}
        setFeatures={setFeatures}
        nameField={nameField}
        slugField={slugField}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <ImageField label="Thumbnail" value={thumbnail} onChange={setThumbnail} />
        <ImageField label="Desktop preview" value={desktop} onChange={setDesktop} />
        <ImageField label="Mobile preview" value={mobile} onChange={setMobile} />
      </div>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? (progress ?? "Working...") : "Upload theme for review"}
      </Button>
    </form>
  );
}

export function EditThemeForm({ theme, categories }: { theme: AdminTheme; categories: CategoryOption[] }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ThemeActionResult>({});
  const [features, setFeatures] = useState(theme.supported_features.join(", "));
  const [thumbnail, setThumbnail] = useState(theme.thumbnail_url);
  const [desktop, setDesktop] = useState(theme.desktop_preview_url);
  const [mobile, setMobile] = useState(theme.mobile_preview_url);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ThemeDetailsValues>({
    resolver: zodResolver(themeDetailsSchema),
    defaultValues: {
      name: theme.name,
      slug: theme.slug,
      description: theme.description ?? "",
      categoryId: theme.category_id ?? "",
      isPremium: theme.is_premium,
      isFeatured: theme.is_featured,
      authorName: theme.author_name ?? "",
      authorUrl: theme.author_url ?? "",
      previewUrl: /^https?:/i.test(theme.preview_url ?? "") ? theme.preview_url : "",
      supportedFeatures: theme.supported_features,
    },
  });

  const onSubmit = (details: ThemeDetailsValues) => {
    setResult({});
    startTransition(async () => {
      try {
        setResult(
          await updateThemeDetails(theme.id, {
            ...details,
            supportedFeatures: featureList(features),
            thumbnailUrl: thumbnail,
            desktopPreviewUrl: desktop,
            mobilePreviewUrl: mobile,
          }),
        );
      } catch {
        setResult({ error: "Something went wrong. Please try again." });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} method="post" className="space-y-5" noValidate>
      <FormStatus result={result} />
      <DetailsFields
        register={register}
        errors={errors}
        categories={categories}
        features={features}
        setFeatures={setFeatures}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <ImageField label="Thumbnail" value={thumbnail} onChange={setThumbnail} />
        <ImageField label="Desktop preview" value={desktop} onChange={setDesktop} />
        <ImageField label="Mobile preview" value={mobile} onChange={setMobile} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save details"}
      </Button>
    </form>
  );
}

export function NewVersionForm({ themeId }: { themeId: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ThemeActionResult>({});
  const [file, setFile] = useState<File | null>(null);
  const [version, setVersion] = useState("");
  const [changelog, setChangelog] = useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setResult({});
    if (!versionNumberSchema.safeParse(version).success) {
      setResult({ error: "Use a version like 1.1.0." });
      return;
    }
    if (!file) {
      setResult({ error: "Choose a ZIP package." });
      return;
    }
    startTransition(async () => {
      try {
        const upload = await uploadPackageFile(file);
        if (!upload.path) {
          setResult({ error: upload.error });
          return;
        }
        const outcome = await uploadThemeVersion({ themeId, packagePath: upload.path, version, changelog });
        setResult(outcome);
        if (!outcome.error && !outcome.errors) {
          setVersion("");
          setChangelog("");
          setFile(null);
        }
      } catch {
        setResult({ error: "Something went wrong. Please try again." });
      }
    });
  };

  return (
    <form onSubmit={submit} method="post" className="space-y-3" noValidate>
      <FormStatus result={{ error: result.error, message: result.message }} />
      <ErrorList errors={result.errors} />
      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1.5">
          <label htmlFor="newVersionFile" className="block text-sm font-medium">
            ZIP package
          </label>
          <input
            id="newVersionFile"
            type="file"
            accept=".zip,application/zip"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="block w-full text-sm text-secondary-text file:mr-2 file:h-10 file:cursor-pointer file:rounded-md file:border file:border-border file:bg-surface file:px-3 file:text-sm file:font-semibold file:text-foreground"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="newVersion" className="block text-sm font-medium">
            Version
          </label>
          <input
            id="newVersion"
            value={version}
            placeholder="1.1.0"
            onChange={(event) => setVersion(event.target.value)}
            className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="changelog" className="block text-sm font-medium">
            What changed (optional)
          </label>
          <input
            id="changelog"
            value={changelog}
            maxLength={500}
            onChange={(event) => setChangelog(event.target.value)}
            className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
          />
        </div>
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Checking package..." : "Upload new version"}
      </Button>
    </form>
  );
}
