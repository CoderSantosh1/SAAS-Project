import { createClient } from "@/lib/supabase/client";

const MAX_PACKAGE_BYTES = 25 * 1024 * 1024;

const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

// Goes straight to the private bucket. Row-level security allows this only with the
// themes.manage permission, and the file stays unprocessed until the server checks it.
export async function uploadPackageFile(file: File): Promise<{ path?: string; error?: string }> {
  if (!file.name.toLowerCase().endsWith(".zip")) return { error: "Please choose a .zip file." };
  if (file.size > MAX_PACKAGE_BYTES) return { error: "The package is larger than 25 MB." };

  const path = `uploads/${crypto.randomUUID()}.zip`;
  const { error } = await createClient()
    .storage.from("theme-packages")
    .upload(path, file, { contentType: "application/zip" });
  return error ? { error: "We could not upload the package. Please try again." } : { path };
}

export async function uploadThemeImage(file: File): Promise<{ url?: string; error?: string }> {
  const extension = IMAGE_EXTENSIONS[file.type];
  if (!extension) return { error: "Please choose a PNG, JPG or WebP image." };
  if (file.size > 10 * 1024 * 1024) return { error: "Images can be up to 10 MB." };

  const supabase = createClient();
  const path = `themes/previews/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from("platform-media")
    .upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (error) return { error: "We could not upload that image. Please try again." };
  return { url: supabase.storage.from("platform-media").getPublicUrl(path).data.publicUrl };
}
