const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/bmp",
  "image/tiff",
  "image/heic",
  "image/heif",
]);
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB (the client also auto-resizes big photos)

const EXTENSION_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  jpe: "image/jpeg",
  jfif: "image/jpeg",
  pjpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  bmp: "image/bmp",
  tif: "image/tiff",
  tiff: "image/tiff",
  heic: "image/heic",
  heif: "image/heif",
};

/**
 * Resolves the real image MIME type of a file. Browsers/OSes often report an empty
 * type, "application/octet-stream" or "image/jpg" (e.g. .jfif, .heic), so fall back
 * to the file extension.
 */
export function resolveImageMimeType(file: { name: string; type: string }): string {
  const reported = (file.type || "").toLowerCase();
  if (reported === "image/jpg" || reported === "image/pjpeg") return "image/jpeg";
  if (ALLOWED_MIME_TYPES.has(reported)) return reported;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_TO_MIME[ext] ?? reported;
}

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.has(resolveImageMimeType(file))) {
    return "Unsupported file type. Use JPG, PNG, WEBP, AVIF, GIF, BMP, TIFF or HEIC.";
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "File is too large. Maximum size is 25MB.";
  }
  if (file.size === 0) {
    return "File is empty.";
  }
  return null;
}
