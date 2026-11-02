import "server-only";
import { readFile } from "fs/promises";
import { join } from "path";

let cachedLogo: Buffer | null = null;

export async function getLogoBuffer(): Promise<Buffer | null> {
  if (cachedLogo) return cachedLogo;
  try {
    const p = join(process.cwd(), "public", "logo-mark.png");
    cachedLogo = await readFile(p);
    return cachedLogo;
  } catch {
    return null;
  }
}
