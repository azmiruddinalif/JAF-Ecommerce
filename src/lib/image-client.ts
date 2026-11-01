/**
 * Browser-only helpers for the admin multi-image uploaders.
 */

const IMAGE_EXTENSIONS = new Set([
  "jpg", "jpeg", "jpe", "jfif", "pjpeg", "png", "webp", "avif",
  "gif", "bmp", "tif", "tiff", "heic", "heif",
]);

/** True for any image file — even when the OS reports an empty/odd MIME type. */
export function isImageFile(file: File): boolean {
  if (file.type && file.type.startsWith("image/")) return true;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return IMAGE_EXTENSIONS.has(ext);
}

/** Natural filename order so "2.jpg" comes before "10.jpg" (serial-by-serial). */
export function sortFilesNaturally(files: File[]): File[] {
  return [...files].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }),
  );
}

const COMPRESS_THRESHOLD_BYTES = 700 * 1024;
const WEB_SAFE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

/**
 * Downscales big photos (max 1800px, WebP/JPEG) before upload so mobile photos
 * fit inside memory and request-size limits without freezing the browser.
 * Uses createImageBitmap when available and falls back smoothly to an Image element.
 * Never throws — always falls back to the original file if anything fails.
 */
export async function compressImageForUpload(
  file: File,
  maxDimension = 1800,
  quality = 0.86,
): Promise<File> {
  const needsConversion = !WEB_SAFE_TYPES.has(file.type);
  if (file.size <= COMPRESS_THRESHOLD_BYTES && !needsConversion) return file;
  if (typeof document === "undefined") return file;

  let sourceWidth = 0;
  let sourceHeight = 0;
  let drawableSource: CanvasImageSource | null = null;
  let cleanup = () => {};

  try {
    // 1. Try modern createImageBitmap (fastest & lowest overhead)
    if (typeof createImageBitmap !== "undefined") {
      try {
        const bitmap = await createImageBitmap(file);
        sourceWidth = bitmap.width;
        sourceHeight = bitmap.height;
        drawableSource = bitmap;
        cleanup = () => {
          try {
            bitmap.close();
          } catch {
            // ignore
          }
        };
      } catch {
        drawableSource = null;
      }
    }

    // 2. Fallback to standard Image element if createImageBitmap is missing or threw
    if (!drawableSource) {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Image decode failed"));
        img.src = objectUrl;
      });
      sourceWidth = img.naturalWidth || img.width;
      sourceHeight = img.naturalHeight || img.height;
      drawableSource = img;
      cleanup = () => {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {
          // ignore
        }
      };
    }

    if (!drawableSource || sourceWidth <= 0 || sourceHeight <= 0) {
      cleanup();
      return file;
    }

    const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      cleanup();
      return file;
    }

    ctx.drawImage(drawableSource, 0, 0, width, height);
    cleanup();

    // Prefer WebP for size & quality; fallback to JPEG if toBlob fails
    let blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality),
    );

    if (!blob) {
      blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality),
      );
    }

    // Free canvas memory immediately
    canvas.width = 0;
    canvas.height = 0;

    if (!blob || blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "");
    const ext = blob.type === "image/webp" ? "webp" : "jpg";

    return new File([blob], `${baseName}.${ext}`, {
      type: blob.type,
      lastModified: Date.now(),
    });
  } catch {
    cleanup();
    return file;
  }
}
