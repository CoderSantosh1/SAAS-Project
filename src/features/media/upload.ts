import { createClient } from "@/lib/supabase/client";
import { recordMediaAsset } from "./actions";
import { MAX_IMAGE_BYTES, ALLOWED_IMAGE_TYPES, type MediaRecordValues } from "./schemas";

const EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

function readDimensions(file: File) {
  return createImageBitmap(file)
    .then((bitmap) => {
      const size = { width: bitmap.width, height: bitmap.height };
      bitmap.close();
      return size;
    })
    .catch(() => null);
}

// Uploads go straight from the browser to storage, because server actions have a small
// body limit. The bucket enforces type and size, and RLS confines writes to the
// user's own folder, so the checks here are only for quick, friendly errors.
export async function uploadImage(file: File): Promise<{ url?: string; error?: string }> {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return { error: "Please choose a PNG, JPG, WebP, GIF or AVIF image." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: "Images can be up to 10 MB." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  const path = `${user.id}/${crypto.randomUUID()}.${EXTENSIONS[file.type]}`;
  const { error: uploadError } = await supabase.storage
    .from("user-media")
    .upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (uploadError) return { error: "We could not upload that image. Please try again." };

  const dimensions = await readDimensions(file);
  const recorded = await recordMediaAsset({
    path,
    fileName: file.name,
    mimeType: file.type as MediaRecordValues["mimeType"],
    sizeBytes: file.size,
    width: dimensions?.width,
    height: dimensions?.height,
  });

  if (recorded.error) {
    await supabase.storage.from("user-media").remove([path]);
    return { error: recorded.error };
  }

  return { url: supabase.storage.from("user-media").getPublicUrl(path).data.publicUrl };
}
