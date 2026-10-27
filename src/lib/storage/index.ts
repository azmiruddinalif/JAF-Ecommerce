import "server-only";
import type { ImageStorage } from "./types";
import { imageStorage as supabaseStorage } from "./supabase";
import { imageStorage as cloudinaryStorage } from "./cloudinary";

/**
 * Active image storage provider. Controlled by STORAGE_PROVIDER so the
 * provider can be swapped via environment config alone — no caller needs
 * to change. Defaults to Supabase Storage.
 */
const provider = (process.env.STORAGE_PROVIDER ?? "supabase").toLowerCase();

export const imageStorage: ImageStorage =
  provider === "cloudinary" ? cloudinaryStorage : supabaseStorage;

export type { ImageStorage, UploadedImage } from "./types";
