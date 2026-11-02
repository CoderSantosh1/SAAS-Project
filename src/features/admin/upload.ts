import { createClient } from "@/lib/supabase/client";

const EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
};

// Straight to the bucket, because server actions have a small body limit. Row-level
// security limits each folder to its permission, and the bucket limits type and size.
export async function uploadAdminImage(file: File, folder: "categories" | "settings" | "library") {
  const extension = EXTENSIONS[file.type];
  if (!extension) return { error: "Please choose a PNG, JPG, WebP, GIF, AVIF or ICO image." };
  if (file.size > 10 * 1024 * 1024) return { error: "Images can be up to 10 MB." };

  const contentType = extension === "ico" ? "image/x-icon" : file.type;
  const supabase = createClient();
  const path = `${folder}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from("platform-media")
    .upload(path, file, { contentType, cacheControl: "31536000" });
  if (error) return { error: "We could not upload that image. Please try again." };

  return { path, contentType, url: supabase.storage.from("platform-media").getPublicUrl(path).data.publicUrl };
}
