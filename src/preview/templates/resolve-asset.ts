/**
 * Resolve static asset files (CSS, JS) relative to this directory.
 * Used by gallery-page.ts and research-page.ts to load extracted static content.
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));

export function resolveAsset(relativePath: string): string {
  return readFileSync(join(__dir, relativePath), "utf-8");
}
