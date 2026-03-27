import { spawn } from "node:child_process";
import { access, readdir, rm } from "node:fs/promises";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = resolve(root, "dist");
const tscBin = resolve(root, "node_modules", "typescript", "bin", "tsc");
const buildInfo = resolve(root, "tsconfig.build.tsbuildinfo");

const distExists = await pathExists(distDir);
if (!distExists) {
  await rm(buildInfo, { force: true });
} else {
  await removeMapFiles(distDir);
}

const exitCode = await new Promise((resolveExit, reject) => {
  const child = spawn(
    process.execPath,
    [tscBin, "-p", resolve(root, "tsconfig.build.json"), "--pretty", "false"],
    {
      cwd: root,
      stdio: "inherit",
    },
  );

  child.on("error", reject);
  child.on("exit", (code) => resolveExit(code ?? 1));
});

process.exit(exitCode);

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function removeMapFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });

  await Promise.all(entries.map(async (entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      await removeMapFiles(fullPath);
      return;
    }

    if (entry.name.endsWith(".map")) {
      await rm(fullPath, { force: true });
    }
  }));
}
