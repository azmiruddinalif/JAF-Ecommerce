const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/jfif",
  "image/png",
  "image/x-png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/heic",
  "image/heif",
  "image/svg+xml",
  "image/bmp",
  "image/tiff",
]);

const ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".avif",
  ".jfif",
  ".gif",
  ".heic",
  ".heif",
  ".svg",
  ".bmp",
  ".tiff",
]);

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

export function validateImageFile(file: File): string | null {
  if (!file || typeof file.size !== "number") {
    return "Invalid file.";
  }

  if (file.size === 0) {
    return "File is empty.";
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "File is too large. Maximum size is 20MB.";
  }

  const rawType = (file.type || "").toLowerCase().trim();
  const fileName = (file.name || "").toLowerCase().trim();
  const ext = fileName.includes(".") ? `.${fileName.split(".").pop()}` : "";

  // 1. Explicitly whitelisted image MIME type
  if (ALLOWED_MIME_TYPES.has(rawType)) {
    return null;
  }

  // 2. Any MIME type starting with "image/"
  if (rawType.startsWith("image/")) {
    return null;
  }

  // 3. Fallback to file extension when browser sets generic/empty MIME type (e.g. application/octet-stream on Windows)
  if (ALLOWED_EXTENSIONS.has(ext)) {
    return null;
  }

  return "Unsupported file type. Use JPEG, PNG, WEBP, AVIF, or JFIF.";
}
