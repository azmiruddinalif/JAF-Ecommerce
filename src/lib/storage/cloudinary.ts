import "server-only";
import { v2 as cloudinary } from "cloudinary";
import type { ImageStorage, UploadedImage } from "./types";

let configured = false;

function ensureConfigured() {
  if (configured) return;

  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;

  if (!cloud_name || !api_key || !api_secret) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET."
    );
  }

  cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
  configured = true;
}

class CloudinaryStorage implements ImageStorage {
  async upload(
    file: Buffer,
    options: { folder: string; filename?: string; contentType?: string }
  ): Promise<UploadedImage> {
    ensureConfigured();

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: options.folder,
          public_id: options.filename,
          resource_type: options.contentType === "application/pdf" ? "raw" : "image",
          // Overwrite enabled so callers that reuse a fixed
          // filename (e.g. invoice regeneration) replace the old one
          // at the same path, rather than silently creating duplicates.
          overwrite: true,
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error("Cloudinary upload failed"));
            return;
          }
          resolve({
            publicId: result.public_id,
            secureUrl: result.secure_url,
            width: result.width,
            height: result.height,
          });
        }
      );
      uploadStream.end(file);
    });
  }

  async remove(publicId: string): Promise<void> {
    ensureConfigured();
    await cloudinary.uploader.destroy(publicId);
  }
}

export const imageStorage: ImageStorage = new CloudinaryStorage();
