/**
 * Browser-only helpers for the admin multi-image uploaders.
 */

const IMAGE_EXTENSIONS = new Set([
  "jpg", "jpeg", "jpe", "jfif", "pjpeg", "png", "webp", "avif",
  "gif", "bmp", "tif", "tiff", "heic", "heif",
]);

/** True for any image file — even when the OS reports an empty/odd MIME type. */
export function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return IMAGE_EXTENSIONS.has(ext);
}

/** Natural filename order so "2.jpg" comes before "10.jpg" (serial-by-serial). */
export function sortFilesNaturally(files: File[]): File[] {
  return [...files].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }),
  );
}

const COMPRESS_THRESHOLD_BYTES = 600 * 1024;
const WEB_SAFE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

/**
 * Prepares any kind of image for upload: re-encodes big photos (max 1800px) and
 * odd formats (GIF, BMP, TIFF, JFIF, HEIC where the browser can decode it) to
 * WebP so several images fit inside the request-size limit of serverless hosting.
 * Falls back to the original file when the browser can't decode it — the server
 * (Cloudinary) accepts HEIC/GIF/BMP/TIFF natively.
 */
export async function compressImageForUpload(
  file: File,
  maxDimension = 1800,
  quality = 0.86,
): Promise<File> {
  const needsConversion = !WEB_SAFE_TYPES.has(file.type);
  if (file.size <= COMPRESS_THRESHOLD_BYTES && !needsConversion) return file;
  if (typeof createImageBitmap === "undefined" || typeof document === "undefined") {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality),
    );
    if (!blob || blob.type !== "image/webp") return file;
    // Keep the original only when it is already a web-safe type and not smaller after re-encoding.
    if (!needsConversion && blob.size >= file.size) return file;

    return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}
