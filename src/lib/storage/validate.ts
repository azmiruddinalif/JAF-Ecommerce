const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8MB

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return "Unsupported file type. Use JPEG, PNG, WEBP or AVIF.";
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "File is too large. Maximum size is 8MB.";
  }
  if (file.size === 0) {
    return "File is empty.";
  }
  return null;
}
