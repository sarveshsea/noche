/**
 * `memi upgrade` — self-update the standalone binary.
 *
 * Only meaningful when running the prebuilt binary (not the npm install, which
 * upgrades via `npm i -g @sarveshsea/memoire`). Detects the current platform,
 * downloads the latest release archive from GitHub, verifies SHA256, and
 * swaps the binary + sidecar assets atomically.
 */

import type { Command } from "commander";
import { createHash } from "node:crypto";
import { chmodSync, createWriteStream, existsSync, mkdirSync, renameSync, rmSync } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import type { MemoireEngine } from "../engine/core.js";
import { packageRoot } from "../utils/asset-path.js";

const REPO = "sarveshsea/m-moire";

function detectTarget(): { target: string; ext: string; archive: "tar.gz" | "zip" } | null {
  const platform = process.platform;
  const arch = process.arch;
  if (platform === "darwin" && arch === "arm64") return { target: "darwin-arm64", ext: "", archive: "tar.gz" };
  if (platform === "darwin" && arch === "x64")   return { target: "darwin-x64",   ext: "", archive: "tar.gz" };
  if (platform === "linux"  && arch === "x64")   return { target: "linux-x64",    ext: "", archive: "tar.gz" };
  if (platform === "win32"  && arch === "x64")   return { target: "win-x64",      ext: ".exe", archive: "zip" };
  return null;
}

function isStandaloneBinary(): boolean {
  // Compiled via bun build --compile → process.execPath points at the memi
  // binary itself (not node). In dev/npm install, execPath is node.
  const exec = process.execPath.toLowerCase();
  return exec.endsWith("memi") || exec.endsWith("memi.exe") || exec.includes("/memi-") || exec.includes("\\memi-");
}

async function download(url: string, dest: string): Promise<void> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`download failed: ${res.status} ${res.statusText} (${url})`);
  if (!res.body) throw new Error("empty response body");
  await mkdir(dirname(dest), { recursive: true });
  await pipeline(Readable.fromWeb(res.body as never), createWriteStream(dest));
}

async function sha256File(path: string): Promise<string> {
  const buf = await readFile(path);
  return createHash("sha256").update(buf).digest("hex");
}

function extract(archivePath: string, destDir: string, archive: "tar.gz" | "zip"): void {
  mkdirSync(destDir, { recursive: true });
  const result = archive === "zip"
    ? spawnSync("unzip", ["-o", archivePath, "-d", destDir], { stdio: "inherit" })
    : spawnSync("tar", ["-xzf", archivePath, "-C", destDir], { stdio: "inherit" });
  if (result.status !== 0) throw new Error(`extract failed for ${archivePath}`);
}

export function registerUpgradeCommand(program: Command, _engine: MemoireEngine): void {
  program
    .command("upgrade")
    .description("Self-update the standalone memi binary to the latest release")
    .option("--version <tag>", "Install a specific version (e.g. v1.2.3)", "latest")
    .option("--check", "Check for updates without installing")
    .action(async (opts: { version: string; check?: boolean }) => {
      if (!isStandaloneBinary()) {
        console.log("  memi was installed via npm. Upgrade with:");
        console.log("    npm i -g @sarveshsea/memoire@latest");
        return;
      }

      const plat = detectTarget();
      if (!plat) {
        console.error(`  Unsupported platform: ${process.platform}-${process.arch}`);
        process.exit(1);
      }

      const base = opts.version === "latest"
        ? `https://github.com/${REPO}/releases/latest/download`
        : `https://github.com/${REPO}/releases/download/${opts.version}`;

      const archiveName = `memi-${plat.target}.${plat.archive}`;
      const archiveUrl = `${base}/${archiveName}`;
      const sumsUrl = `${base}/SHA256SUMS.txt`;

      if (opts.check) {
        console.log(`  Checking ${archiveUrl} ...`);
        const head = await fetch(archiveUrl, { method: "HEAD", redirect: "follow" });
        console.log(`  ${head.ok ? "Available" : "Not found"} (HTTP ${head.status})`);
        return;
      }

      const root = packageRoot();
      const stagingDir = join(tmpdir(), `memi-upgrade-${Date.now()}`);
      const archivePath = join(stagingDir, archiveName);

      try {
        console.log(`▸ Downloading ${archiveName}`);
        await download(archiveUrl, archivePath);

        const actualSha = await sha256File(archivePath);
        try {
          const sumsPath = join(stagingDir, "SHA256SUMS.txt");
          await download(sumsUrl, sumsPath);
          const sums = await readFile(sumsPath, "utf-8");
          const expected = sums.split("\n")
            .map(l => l.trim())
            .find(l => l.endsWith(archiveName))?.split(/\s+/)[0];
          if (!expected) {
            console.warn(`  ! No SHA256 for ${archiveName} in manifest — continuing`);
          } else if (expected !== actualSha) {
            throw new Error(`SHA256 mismatch — expected ${expected}, got ${actualSha}`);
          } else {
            console.log("✓ SHA256 verified");
          }
        } catch (err) {
          console.warn(`  ! SHA256SUMS.txt unavailable (${(err as Error).message}) — continuing without verification`);
        }

        console.log(`▸ Extracting to ${root}`);
        extract(archivePath, stagingDir, plat.archive);

        const extractedRoot = join(stagingDir, `memi-${plat.target}`);
        if (!existsSync(extractedRoot)) throw new Error(`extracted root not found: ${extractedRoot}`);

        const backupDir = `${root}.backup-${Date.now()}`;
        renameSync(root, backupDir);
        try {
          renameSync(extractedRoot, root);
          chmodSync(join(root, `memi${plat.ext}`), 0o755);
          rmSync(backupDir, { recursive: true, force: true });
          console.log(`✓ Upgrade complete. Run:  memi --version`);
        } catch (err) {
          // Roll back on failure
          if (existsSync(root)) rmSync(root, { recursive: true, force: true });
          renameSync(backupDir, root);
          throw err;
        }
      } finally {
        rmSync(stagingDir, { recursive: true, force: true });
      }
    });
}
