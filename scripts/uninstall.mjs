#!/usr/bin/env node

/**
 * Mémoire uninstall — removes all Mémoire artifacts from the user's system.
 *
 * Usage:
 *   npx @sarveshsea/memoire uninstall
 *   — or —
 *   node scripts/uninstall.mjs
 *
 * What it removes:
 *   ~/.memoire/           Figma plugin copy + install metadata
 *   .memoire/             Project-local state (sync, agents, daemon)
 *
 * What it does NOT remove:
 *   specs/                User-created spec files (your work)
 *   generated/            User-generated code (your work)
 *   .env.local            User config (your credentials)
 */

import { rmSync, existsSync } from "fs";
import { join } from "path";

const home = process.env.HOME || process.env.USERPROFILE || "";
const globalDir = join(home, ".memoire");
const localDir = join(process.cwd(), ".memoire");

let removed = 0;

// 1. Remove global plugin directory
if (home && existsSync(globalDir)) {
  rmSync(globalDir, { recursive: true, force: true });
  console.log(`  - Removed ${globalDir}`);
  removed++;
} else {
  console.log(`  . ${globalDir} — not found, skipping`);
}

// 2. Remove project-local .memoire directory
if (existsSync(localDir)) {
  rmSync(localDir, { recursive: true, force: true });
  console.log(`  - Removed ${localDir}`);
  removed++;
} else {
  console.log(`  . ${localDir} — not found, skipping`);
}

// 3. Remind about npm uninstall
if (removed > 0) {
  console.log();
  console.log("  Mémoire artifacts removed.");
}
console.log();
console.log("  To fully uninstall the package:");
console.log("    npm uninstall -g @sarveshsea/memoire");
console.log();
