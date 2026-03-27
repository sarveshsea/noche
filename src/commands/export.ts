/**
 * `memi export` — Copies generated components from Mémoire's `generated/`
 * folder into the user's actual project, respecting their framework paths.
 */

import type { Command } from "commander";
import type { MemoireEngine } from "../engine/core.js";
import { readdir, readFile, writeFile, mkdir, access } from "fs/promises";
import { join, relative } from "path";

type ExportKind = "components" | "pages" | "dataviz" | "other";
type ExportStatus = "would-write" | "written" | "skipped" | "failed";

export interface ExportResultPayload {
  source: string;
  kind: ExportKind;
  targetBase: string;
  destination: string;
  status: ExportStatus;
  reason: string | null;
}

export interface ExportPayload {
  status: "completed" | "partial" | "failed" | "empty";
  options: {
    target: string | null;
    dryRun: boolean;
    force: boolean;
    json: boolean;
  };
  summary: {
    discovered: number;
    attempted: number;
    written: number;
    skipped: number;
    failed: number;
  };
  exports: ExportResultPayload[];
  elapsedMs: number;
  error?: {
    message: string;
  };
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
      const startedAt = Date.now();

      try {
        await engine.init();

        const project = engine.project;
        if (!project) {
          if (opts.json) {
            console.log(JSON.stringify(buildExportPayload({
              options: makeOptions(opts),
              discovered: 0,
              attempted: 0,
              written: 0,
              skipped: 0,
              failed: 0,
              exports: [],
              elapsedMs: Date.now() - startedAt,
              error: { message: "Could not detect project context. Run `memi init` first." },
            }), null, 2));
            process.exitCode = 1;
            return;
          }

          console.log("\n  x Could not detect project context. Run `memi init` first.\n");
          return;
        }

        const generatedDir = join(engine.config.projectRoot, "generated");
        const files = await walkDir(generatedDir);
        if (files.length === 0) {
          const payload = buildExportPayload({
            options: makeOptions(opts),
            discovered: 0,
            attempted: 0,
            written: 0,
            skipped: 0,
            failed: 0,
            exports: [],
            elapsedMs: Date.now() - startedAt,
          });

          if (opts.json) {
            console.log(JSON.stringify(payload, null, 2));
          } else {
            console.log("\n  · No generated files found. Run `memi generate` or `memi go` first.\n");
          }
          return;
        }

        if (!opts.json) {
          console.log(`\n  Exporting ${files.length} files to project destinations\n`);
        }

        const exports: ExportResultPayload[] = [];
        let written = 0;
        let skipped = 0;
        let failed = 0;

        for (const file of files) {
          const relPath = relative(generatedDir, file);
          const kind = getExportKind(relPath);
          const targetBase = getTargetBase(engine.config.projectRoot, project, opts.target, kind);
          const mappedRelPath = stripGeneratedPrefix(relPath);
          const targetPath = join(targetBase, mappedRelPath);
          const targetBaseRelative = relative(engine.config.projectRoot, targetBase);
          const destinationRelative = relative(engine.config.projectRoot, targetPath);

          if (opts.dryRun) {
            exports.push({
              source: relPath,
              kind,
              targetBase: targetBaseRelative,
              destination: destinationRelative,
              status: "would-write",
              reason: null,
            });
            if (!opts.json) {
              console.log(`  · ${relPath} → ${destinationRelative}`);
            }
            written++;
            continue;
          }

          if (!opts.force) {
            try {
              await access(targetPath);
              exports.push({
                source: relPath,
                kind,
                targetBase: targetBaseRelative,
                destination: destinationRelative,
                status: "skipped",
                reason: "exists",
              });
              if (!opts.json) {
                console.log(`  ! Skipping ${relPath} (exists, use --force to overwrite)`);
              }
              skipped++;
              continue;
            } catch {
              // File doesn't exist, safe to write.
            }
          }

          try {
            const content = await readFile(file, "utf-8");
            await mkdir(join(targetPath, ".."), { recursive: true });
            await writeFile(targetPath, content);
            exports.push({
              source: relPath,
              kind,
              targetBase: targetBaseRelative,
              destination: destinationRelative,
              status: "written",
              reason: null,
            });
            if (!opts.json) {
              console.log(`  + ${relPath}`);
            }
            written++;
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            exports.push({
              source: relPath,
              kind,
              targetBase: targetBaseRelative,
              destination: destinationRelative,
              status: "failed",
              reason: message,
            });
            if (!opts.json) {
              console.error(`  x ${relPath}: ${message}`);
            }
            failed++;
          }
        }

        const payload = buildExportPayload({
          options: makeOptions(opts),
          discovered: files.length,
          attempted: files.length,
          written,
          skipped,
          failed,
          exports,
          elapsedMs: Date.now() - startedAt,
        });

        if (opts.json) {
          console.log(JSON.stringify(payload, null, 2));
          if (failed > 0) {
            process.exitCode = 1;
          }
          return;
        }

        if (opts.dryRun) {
          console.log(`\n  Dry run: would export ${written} files\n`);
        } else {
          console.log(`\n  + Exported ${written} files${skipped > 0 ? `, skipped ${skipped}` : ""}${failed > 0 ? `, failed ${failed}` : ""}\n`);
        }
      } catch (err) {
        if (opts.json) {
          const message = err instanceof Error ? err.message : String(err);
          console.log(JSON.stringify(buildExportPayload({
            options: makeOptions(opts),
            discovered: 0,
            attempted: 0,
            written: 0,
            skipped: 0,
            failed: 1,
            exports: [],
            elapsedMs: Date.now() - startedAt,
            error: { message },
          }), null, 2));
          process.exitCode = 1;
          return;
        }

        throw err;
      }
    });
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

function buildExportPayload(input: {
  options: ExportPayload["options"];
  discovered: number;
  attempted: number;
  written: number;
  skipped: number;
  failed: number;
  exports: ExportResultPayload[];
  elapsedMs: number;
  error?: {
    message: string;
  };
}): ExportPayload {
  const status = input.error
    ? "failed"
    : input.discovered === 0
    ? "empty"
    : input.failed > 0
      ? input.written > 0 || input.skipped > 0
        ? "partial"
        : "failed"
      : "completed";

  return {
    status,
    options: input.options,
    summary: {
      discovered: input.discovered,
      attempted: input.attempted,
      written: input.written,
      skipped: input.skipped,
      failed: input.failed,
    },
    exports: input.exports,
    elapsedMs: input.elapsedMs,
    error: input.error,
  };
}

function makeOptions(opts: { target?: string; dryRun?: boolean; force?: boolean; json?: boolean }): ExportPayload["options"] {
  return {
    target: opts.target ?? null,
    dryRun: Boolean(opts.dryRun),
    force: Boolean(opts.force),
    json: Boolean(opts.json),
  };
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
