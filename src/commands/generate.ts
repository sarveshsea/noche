import type { Command } from "commander";
import type { MemoireEngine } from "../engine/core.js";
import type { CodegenResult } from "../codegen/generator.js";
import { ui } from "../tui/format.js";
import { checkCapabilities, formatCapabilityError } from "../engine/capabilities.js";

export interface GeneratePayload {
  mode: "single" | "all";
  status: "completed" | "partial" | "failed" | "empty";
  target: string | null;
  options: {
    all: boolean;
    json: boolean;
    preview: boolean;
  };
  summary: {
    totalSpecs: number;
    attempted: number;
    generated: number;
    failed: number;
  };
  results: GenerateResultPayload[];
  generatedFiles: string[];
  elapsedMs: number;
  error?: {
    message: string;
  };
}

export interface GenerateResultPayload {
  name: string;
  status: "generated" | "failed";
  entryFile: string | null;
  error: string | null;
}

export function registerGenerateCommand(program: Command, engine: MemoireEngine) {
  program
    .command("generate [specName]")
    .description("Generate code from a spec (or all specs if no name given)")
    .option("-a, --all", "Generate all specs")
    .option("--json", "Output generate results as JSON")
    .option("--preview", "Show generated code diff without writing files")
    .action(async (specName: string | undefined, opts: { all?: boolean; json?: boolean; preview?: boolean }) => {
      const startedAt = Date.now();
      const generateAll = Boolean(opts.all || !specName);

      try {
        await engine.init();

        // ── Preview mode — generate in memory, no disk writes ──
        if (opts.preview) {
          const specs = generateAll
            ? await engine.registry.getAllSpecs()
            : specName
              ? [await engine.registry.getSpec(specName)].filter(Boolean)
              : [];

          if (specs.length === 0) {
            if (opts.json) {
              console.log(JSON.stringify({ mode: "preview", results: [], error: specName ? `Spec "${specName}" not found` : "No specs found" }, null, 2));
            } else {
              console.log();
              console.log(ui.pending(specName ? `Spec "${specName}" not found.` : "No specs found."));
              console.log();
            }
            return;
          }

          const project = engine.project;
          if (!project) {
            throw new Error("Engine not initialized. Call init() before generating code.");
          }

          const ctx = { project, designSystem: engine.registry.designSystem };
          const previewResults: { name: string; files: { path: string; content: string }[] }[] = [];

          for (const spec of specs) {
            if (!spec) continue;
            const result: CodegenResult = await engine.codegen.preview(spec, ctx);
            previewResults.push({ name: spec.name, files: result.files });
          }

          if (opts.json) {
            console.log(JSON.stringify({
              mode: "preview",
              results: previewResults.map((r) => ({
                name: r.name,
                files: r.files.map((f) => ({ path: f.path, content: f.content })),
              })),
            }, null, 2));
          } else {
            console.log();
            for (const r of previewResults) {
              for (const f of r.files) {
                console.log(ui.section(f.path));
                const lines = f.content.split("\n");
                const preview = lines.slice(0, 20).join("\n");
                console.log(preview);
                if (lines.length > 20) {
                  console.log(ui.dim(`  ... ${lines.length - 20} more lines`));
                }
                console.log();
              }
            }
          }
          return;
        }

        if (generateAll) {
          const specs = await engine.registry.getAllSpecs();
          if (specs.length === 0) {
            const payload = buildGeneratePayload({
              mode: "all",
              target: null,
              options: {
                all: generateAll,
                json: Boolean(opts.json),
                preview: false,
              },
              results: [],
              generatedFiles: [],
              elapsedMs: Date.now() - startedAt,
            });

            if (opts.json) {
              console.log(JSON.stringify(payload, null, 2));
            } else {
              console.log();
            console.log(ui.pending("No specs found."));
            console.log();
            console.log("  Next steps:");
            console.log("    memi spec component <Name>    Create a component spec manually");
            console.log("    memi pull                     Pull from Figma (auto-generates specs)");
            console.log("    memi init                     Initialize with starter specs");
            console.log();
            }
            return;
          }

          if (!opts.json) {
            console.log(ui.brand("GENERATE"));
            console.log(ui.section("CODEGEN"));
          }

          const results: GenerateResultPayload[] = [];
          const generatedFiles: string[] = [];

          for (const spec of specs) {
            try {
              const entryFile = await engine.generateFromSpec(spec.name);
              results.push({
                name: spec.name,
                status: "generated",
                entryFile,
                error: null,
              });
              generatedFiles.push(entryFile);
              if (!opts.json) {
                console.log(ui.ok(`+ ${entryFile}`));
              }
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err);
              results.push({
                name: spec.name,
                status: "failed",
                entryFile: null,
                error: msg,
              });

              if (!opts.json) {
                console.log(ui.fail(spec.name + ui.dim("  " + msg)));
              }
            }
          }

          const payload = buildGeneratePayload({
            mode: "all",
            target: null,
            options: {
              all: generateAll,
              json: Boolean(opts.json),
              preview: false,
            },
            results,
            generatedFiles,
            elapsedMs: Date.now() - startedAt,
          });

          if (opts.json) {
            console.log(JSON.stringify(payload, null, 2));
            return;
          }

          console.log();
          console.log(ui.rule());
          console.log();
          console.log(ui.ready("DONE") + ui.dim(`  ${payload.summary.generated} generated` + (payload.summary.failed > 0 ? `, ${payload.summary.failed} failed` : "")));
          console.log();
          return;
        }

        if (!specName) {
          throw new Error("Missing spec name for single generation");
        }

        const entryFile = await engine.generateFromSpec(specName);
        const payload = buildGeneratePayload({
          mode: "single",
          target: specName,
          options: {
            all: false,
            json: Boolean(opts.json),
            preview: false,
          },
          results: [{
            name: specName,
            status: "generated",
            entryFile,
            error: null,
          }],
          generatedFiles: [entryFile],
          elapsedMs: Date.now() - startedAt,
        });

        if (opts.json) {
          console.log(JSON.stringify(payload, null, 2));
          return;
        }

        console.log();
        console.log(ui.ok(entryFile));
        console.log();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);

        if (opts.json) {
          const payload = buildGeneratePayload({
            mode: generateAll ? "all" : "single",
            target: generateAll ? null : specName ?? null,
            options: {
              all: generateAll,
              json: Boolean(opts.json),
              preview: false,
            },
            results: [{
              name: specName ?? "all",
              status: "failed",
              entryFile: null,
              error: msg,
            }],
            generatedFiles: [],
            elapsedMs: Date.now() - startedAt,
            error: { message: msg },
          });
          console.log(JSON.stringify(payload, null, 2));
          process.exitCode = 1;
          return;
        }

        console.log();
        console.log(ui.fail(msg));
        console.log();
        process.exit(1);
      }
    });
}

function buildGeneratePayload(input: {
  mode: "single" | "all";
  target: string | null;
  options: GeneratePayload["options"];
  results: GenerateResultPayload[];
  generatedFiles: string[];
  elapsedMs: number;
  error?: {
    message: string;
  };
}): GeneratePayload {
  const generated = input.results.filter((result) => result.status === "generated").length;
  const failed = input.results.filter((result) => result.status === "failed").length;
  const totalSpecs = input.mode === "single"
    ? 1
    : input.results.length;

  return {
    mode: input.mode,
    status: totalSpecs === 0
      ? "empty"
      : failed > 0
        ? generated > 0
          ? "partial"
          : "failed"
        : "completed",
    target: input.target,
    options: input.options,
    summary: {
      totalSpecs,
      attempted: input.results.length,
      generated,
      failed,
    },
    results: input.results,
    generatedFiles: input.generatedFiles,
    elapsedMs: input.elapsedMs,
    error: input.error,
  };
}
