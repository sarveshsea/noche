/**
 * `memi export` — Copies generated components from Mémoire's `generated/`
 * folder into the user's actual project, respecting their framework paths.
 */

import type { Command } from "commander";
import type { MemoireEngine } from "../engine/core.js";
import { readdir, readFile, writeFile, mkdir, access } from "fs/promises";
import { join, relative } from "path";

type ExportKind = "components" | "pages" | "dataviz" | "other";
type ExportStatus = "completed" | "partial" | "empty" | "blocked" | "failed";
type ExportFileStatus = "would-write" | "would-overwrite" | "would-skip" | "written" | "skipped" | "failed";

export interface ExportPayload {
  status: ExportStatus;
  options: {
    target: string | null;
    dryRun: boolean;
    force: boolean;
    json: boolean;
  };
  summary: {
    discovered: number;
    planned: number;
    written: number;
    skipped: number;
    failed: number;
  };
  files: ExportFileResult[];
  error?: {
    message: string;
  };
}

export interface ExportFileResult {
  source: string;
  kind: ExportKind;
  target: string;
  status: ExportFileStatus;
  reason: string | null;
}

export function registerExportCommand(program: Command, engine: MemoireEngine) {
  program
    .command("export")
    .description("Export generated components into your project's source tree")
    .option("-t, --target <dir>", "Override target directory (default: auto-detected from project)")
    .option("--dry-run", "Show what would be copied without writing files")
    .option("--force", "Overwrite existing files without asking")
    .option("--json", "Output export results as JSON")
    .action(async (opts: { target?: string; dryRun?: boolean; force?: boolean; json?: boolean }) => {
      const files: ExportFileResult[] = [];

      try {
        await engine.init();

        const project = engine.project;
        if (!project) {
          const payload = buildExportPayload({
            status: "blocked",
            options: opts,
            files,
            error: { message: "Could not detect project context. Run `memi init` first." },
          });
          if (opts.json) {
            console.log(JSON.stringify(payload, null, 2));
            process.exitCode = 1;
          } else {
            console.log("\n  x Could not detect project context. Run `memi init` first.\n");
          }
          return;
        }

        const generatedDir = join(engine.config.projectRoot, "generated");
        const generatedFiles = await walkDir(generatedDir);
        if (generatedFiles.length === 0) {
          const payload = buildExportPayload({
            status: "empty",
            options: opts,
            files,
          });
          if (opts.json) {
            console.log(JSON.stringify(payload, null, 2));
          } else {
            console.log("\n  · No generated files found. Run `memi generate` or `memi go` first.\n");
          }
          return;
        }

        if (!opts.json) {
          console.log(`\n  Exporting ${generatedFiles.length} files to project destinations\n`);
        }

        for (const file of generatedFiles) {
          const relPath = relative(generatedDir, file);
          const kind = getExportKind(relPath);
          const targetBase = getTargetBase(engine.config.projectRoot, project, opts.target, kind);
          const mappedRelPath = stripGeneratedPrefix(relPath);
          const targetPath = join(targetBase, mappedRelPath);
          const targetRelPath = relative(engine.config.projectRoot, targetPath);

          if (opts.dryRun) {
            const exists = await pathExists(targetPath);
            const action: ExportFileStatus = exists
              ? (opts.force ? "would-overwrite" : "would-skip")
              : "would-write";
            files.push({
              source: relPath,
              kind,
              target: targetRelPath,
              status: action,
              reason: exists ? "exists" : null,
            });
            if (!opts.json) {
              console.log(`  · ${relPath} → ${targetRelPath}`);
            }
            continue;
          }

          if (!opts.force) {
            try {
              await access(targetPath);
              files.push({
                source: relPath,
                kind,
                target: targetRelPath,
                status: "skipped",
                reason: "exists",
              });
              if (!opts.json) {
                console.log(`  ! Skipping ${relPath} (exists, use --force to overwrite)`);
              }
              continue;
            } catch {
              // File doesn't exist, safe to write.
            }
          }

          try {
            const content = await readFile(file, "utf-8");
            await mkdir(join(targetPath, ".."), { recursive: true });
            await writeFile(targetPath, content);
            files.push({
              source: relPath,
              kind,
              target: targetRelPath,
              status: "written",
              reason: null,
            });
            if (!opts.json) {
              console.log(`  + ${relPath}`);
            }
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            files.push({
              source: relPath,
              kind,
              target: targetRelPath,
              status: "failed",
              reason: message,
            });
            if (!opts.json) {
              console.error(`  x ${relPath}: ${message}`);
            }
          }
        }

        const payload = buildExportPayload({
          status: deriveExportStatus(files),
          options: opts,
          files,
        });

        if (opts.json) {
          console.log(JSON.stringify(payload, null, 2));
          if (payload.status === "partial" || payload.status === "failed") {
            process.exitCode = 1;
          }
          return;
        }

        if (opts.dryRun) {
          console.log(`\n  Dry run: would export ${payload.summary.planned} files\n`);
        } else {
          console.log(`\n  + Exported ${payload.summary.written} files${payload.summary.skipped > 0 ? `, skipped ${payload.summary.skipped}` : ""}${payload.summary.failed > 0 ? `, failed ${payload.summary.failed}` : ""}\n`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const payload = buildExportPayload({
          status: files.length > 0 ? "partial" : "failed",
          options: opts,
          files,
          error: { message },
        });

        if (opts.json) {
          console.log(JSON.stringify(payload, null, 2));
          process.exitCode = 1;
          return;
        }

        throw err;
      }
    });
}

function buildExportPayload(input: {
  status: ExportStatus;
  options: {
    target?: string;
    dryRun?: boolean;
    force?: boolean;
    json?: boolean;
  };
  files: ExportFileResult[];
  error?: {
    message: string;
  };
}): ExportPayload {
  const planned = input.files.filter((file) =>
    file.status === "would-write" ||
    file.status === "would-overwrite" ||
    file.status === "would-skip"
  ).length;
  const wouldOverwrite = input.files.filter((file) => file.status === "would-overwrite").length;
  const wouldSkip = input.files.filter((file) => file.status === "would-skip").length;
  const written = input.files.filter((file) => file.status === "written").length;
  const skipped = input.files.filter((file) => file.status === "skipped").length;
  const failed = input.files.filter((file) => file.status === "failed").length;

  return {
    status: input.status,
    options: {
      target: input.options.target ?? null,
      dryRun: Boolean(input.options.dryRun),
      force: Boolean(input.options.force),
      json: Boolean(input.options.json),
    },
    summary: {
      discovered: input.files.length,
      planned: planned + wouldOverwrite + wouldSkip,
      written,
      skipped,
      failed,
    },
    files: input.files,
    error: input.error,
  };
}

function deriveExportStatus(files: ExportFileResult[]): ExportStatus {
  if (files.length === 0) return "empty";

  const planned = files.some((file) =>
    file.status === "would-write" ||
    file.status === "would-overwrite" ||
    file.status === "would-skip"
  );
  const failed = files.some((file) => file.status === "failed");
  const successful = files.some((file) => file.status !== "failed");

  if (failed && successful) return "partial";
  if (failed) return "failed";
  if (planned) return "completed";
  return "completed";
}

async function walkDir(dir: string): Promise<string[]> {
  const results: string[] = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...await walkDir(fullPath));
      } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
        results.push(fullPath);
      }
    }
  } catch {
    // Directory doesn't exist
  }
  return results;
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function getExportKind(relPath: string): ExportKind {
  const [firstSegment] = relPath.split(/[\\/]/);
  if (firstSegment === "components" || firstSegment === "pages" || firstSegment === "dataviz") {
    return firstSegment;
  }
  return "other";
}

function stripGeneratedPrefix(relPath: string): string {
  const segments = relPath.split(/[\\/]/);
  if (segments.length <= 1) return relPath;

  const [firstSegment, ...rest] = segments;
  if (firstSegment === "components" || firstSegment === "pages" || firstSegment === "dataviz") {
    return rest.join("/");
  }

  return relPath;
}

function getTargetBase(
  projectRoot: string,
  project: { paths: { components: string; pages?: string } },
  customTarget: string | undefined,
  kind: ExportKind,
): string {
  if (customTarget) {
    return join(projectRoot, customTarget);
  }

  switch (kind) {
    case "pages":
      return join(projectRoot, project.paths.pages ?? "src/pages");
    case "dataviz":
      return join(projectRoot, project.paths.components, "dataviz");
    case "components":
    default:
      return join(projectRoot, project.paths.components);
  }
}
