/**
 * `memi add <component> --from <registry>` — install a component from
 * a Memoire registry (the shadcn pattern, for design systems).
 *
 * Examples:
 *   memi add Button --from @acme/design-system
 *   memi add Card --from github:acme/ds
 *   memi add Badge --from ./path/to/registry
 */

import type { Command } from "commander";
import type { MemoireEngine } from "../engine/core.js";
import ora from "ora";
import { ui } from "../tui/format.js";
import { installComponent, listRegistryComponents } from "../registry/installer.js";
import { formatElapsed } from "../utils/format.js";

export interface AddPayload {
  status: "installed" | "failed" | "listed";
  component?: string;
  from: string;
  specPath?: string;
  tokensPath?: string;
  generated: string[];
  available?: string[];
  elapsedMs: number;
  error?: string;
}

export function registerAddCommand(program: Command, engine: MemoireEngine) {
  program
    .command("add [component]")
    .description("Install a component from a Memoire registry (npm / github / https / local)")
    .option("--from <registry>", "Registry reference (e.g. @acme/ds, github:user/repo, ./local/path)")
    .option("--tokens", "Also install tokens.css from the registry")
    .option("--regenerate", "Run local codegen instead of using bundled code")
    .option("--target <dir>", "Target directory (default: src/components/memoire)")
    .option("--list", "List components in the registry without installing")
    .option("--json", "Output as JSON")
    .action(async (component: string | undefined, opts: {
      from?: string;
      tokens?: boolean;
      regenerate?: boolean;
      target?: string;
      list?: boolean;
      json?: boolean;
    }) => {
      const start = Date.now();
      if (!opts.from) {
        const err = "Missing --from <registry>. Example: memi add Button --from @acme/design-system";
        if (opts.json) console.log(JSON.stringify({ status: "failed", error: err }));
        else console.error(`\n  ${err}\n`);
        process.exitCode = 1;
        return;
      }

      await engine.init();

      if (opts.list || !component) {
        await handleList(opts.from, opts.json, start);
        return;
      }

      const spinner = opts.json ? null : ora({
        text: `Installing ${component} from ${opts.from}...`, indent: 2, color: "cyan",
      }).start();

      try {
        const result = await installComponent(engine, {
          from: opts.from,
          name: component,
          withTokens: opts.tokens,
          regenerate: opts.regenerate,
          targetDir: opts.target,
        });
        spinner?.stop();

        const payload: AddPayload = {
          status: "installed",
          component,
          from: opts.from,
          specPath: result.specPath,
          tokensPath: result.tokensPath,
          generated: result.generatedFiles,
          elapsedMs: Date.now() - start,
        };

        if (opts.json) {
          console.log(JSON.stringify(payload, null, 2));
          return;
        }

        console.log();
        console.log(ui.ok(`Installed ${component} from ${result.source}`));
        if (result.codePath) console.log(ui.dim(`  Code:   ${result.codePath}`));
        console.log(ui.dim(`  Spec:   ${result.specPath}`));
        if (result.tokensPath) console.log(ui.dim(`  Tokens: ${result.tokensPath}`));
        console.log(ui.dim(`  (${formatElapsed(Date.now() - start)})`));
        console.log();
      } catch (err) {
        spinner?.stop();
        const msg = err instanceof Error ? err.message : String(err);
        const payload: AddPayload = {
          status: "failed",
          component,
          from: opts.from,
          generated: [],
          elapsedMs: Date.now() - start,
          error: msg,
        };
        if (opts.json) {
          console.log(JSON.stringify(payload, null, 2));
        } else {
          console.log();
          console.log(ui.fail(`Install failed: ${msg}`));
          console.log();
        }
        process.exitCode = 1;
      }
    });
}

async function handleList(from: string, json: boolean | undefined, start: number): Promise<void> {
  try {
    const { registry, components } = await listRegistryComponents(from);
    if (json) {
      const payload: AddPayload = {
        status: "listed",
        from,
        generated: [],
        available: components.map(c => c.name),
        elapsedMs: Date.now() - start,
      };
      console.log(JSON.stringify(payload, null, 2));
      return;
    }
    console.log();
    console.log(ui.brand(registry.name) + ui.dim(`  v${registry.version}`));
    if (registry.description) console.log(ui.dim(`  ${registry.description}`));
    console.log();
    console.log(ui.section(`COMPONENTS (${components.length})`));
    for (const c of components) {
      const level = c.level ? ui.dim(`  ${c.level}`) : "";
      console.log(ui.ok(c.name + level));
    }
    console.log();
    console.log(ui.dim(`  Install one:  memi add ${components[0]?.name ?? "<Name>"} --from ${from}`));
    console.log();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (json) console.log(JSON.stringify({ status: "failed", from, error: msg, elapsedMs: Date.now() - start }));
    else console.log(`\n  ${ui.fail(msg)}\n`);
    process.exitCode = 1;
  }
}
