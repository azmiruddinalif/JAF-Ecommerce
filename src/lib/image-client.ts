/**
 * Browser-only helpers for the admin multi-image uploaders.
 */

/** Natural filename order so "2.jpg" comes before "10.jpg" (serial-by-serial). */
export function sortFilesNaturally(files: File[]): File[] {
  return [...files].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }),
  );
}

const COMPRESS_THRESHOLD_BYTES = 600 * 1024;

/**
 * Downscales big photos (max 1800px, WebP) before upload so several images fit
 * inside the request-size limit of server actions / serverless hosting.
 * Falls back to the original file when anything goes wrong.
 */
export async function compressImageForUpload(
  file: File,
  maxDimension = 1800,
  quality = 0.86,
): Promise<File> {
  if (file.size <= COMPRESS_THRESHOLD_BYTES) return file;
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
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}
