export interface UploadedImage {
  publicId: string;
  secureUrl: string;
  width?: number;
  height?: number;
}

/**
 * Storage provider abstraction so the active provider (Cloudinary by default)
 * can be swapped without touching any caller.
 */
export interface ImageStorage {
  upload(
    file: Buffer,
    options: { folder: string; filename?: string; contentType?: string }
  ): Promise<UploadedImage>;
  remove(publicId: string): Promise<void>;
}
