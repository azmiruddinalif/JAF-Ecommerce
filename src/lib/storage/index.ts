import "server-only";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import type { ImageStorage, UploadedImage } from "./types";
import { imageStorage as supabaseStorage } from "./supabase";
import { imageStorage as cloudinaryStorage } from "./cloudinary";

const provider = (process.env.STORAGE_PROVIDER ?? "supabase").toLowerCase();
const primaryStorage: ImageStorage =
  provider === "cloudinary" ? cloudinaryStorage : supabaseStorage;

function extForMime(contentType?: string): string {
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

class FallbackImageStorage implements ImageStorage {
  async upload(
    file: Buffer,
    options: { folder: string; filename?: string; contentType?: string }
  ): Promise<UploadedImage> {
    try {
      return await primaryStorage.upload(file, options);
    } catch {
      const ext = extForMime(options.contentType);
      const safeFolder = options.folder.replace(/[^a-zA-Z0-9/_-]/g, "");
      const name = (options.filename ?? randomUUID()).replace(/[^a-zA-Z0-9_-]/g, "");
      const relPath = `${safeFolder}/${name}.${ext}`;
      const absDir = path.join(process.cwd(), "public", "uploads", safeFolder);
      await mkdir(absDir, { recursive: true });
      await writeFile(path.join(absDir, `${name}.${ext}`), file);
      return {
        publicId: `local:${relPath}`,
        secureUrl: `/uploads/${relPath}`,
      };
    }
  }

  async remove(publicId: string): Promise<void> {
    if (publicId.startsWith("local:")) {
      const relPath = publicId.slice("local:".length);
      const absPath = path.join(process.cwd(), "public", "uploads", relPath);
      await unlink(absPath).catch(() => {});
      return;
    }
    await primaryStorage.remove(publicId).catch(() => {});
  }
}

export const imageStorage: ImageStorage = new FallbackImageStorage();

export type { ImageStorage, UploadedImage } from "./types";
