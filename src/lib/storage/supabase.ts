import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import type { ImageStorage, UploadedImage } from "./types";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "jaf-jersey";

let cachedClient: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  cachedClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
  return cachedClient;
}

function extensionFor(contentType: string | undefined): string {
  switch (contentType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/avif":
      return "avif";
    case "application/pdf":
      return "pdf";
    case "image/jpeg":
    default:
      return "jpg";
  }
}

class SupabaseStorage implements ImageStorage {
  async upload(
    file: Buffer,
    options: { folder: string; filename?: string; contentType?: string }
  ): Promise<UploadedImage> {
    const supabase = getClient();
    const contentType = options.contentType ?? "image/jpeg";
    const extension = extensionFor(contentType);
    const name = options.filename ?? randomUUID();
    const path = `${options.folder}/${name}.${extension}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType,
      upsert: true,
    });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

    return { publicId: path, secureUrl: data.publicUrl };
  }

  async remove(publicId: string): Promise<void> {
    const supabase = getClient();
    const { error } = await supabase.storage.from(BUCKET).remove([publicId]);
    if (error) {
      throw new Error(`Supabase delete failed: ${error.message}`);
    }
  }
}

export const imageStorage: ImageStorage = new SupabaseStorage();
