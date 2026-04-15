/**
 * `memi update [registry]` — reinstall every component we previously
 * installed from a registry, pulling the latest versions.
 *
 * Matches installed components by reading specs in `.memoire/specs/components/`
 * that originated from a registry install (inferred by spec matching a remote
 * registry's component set).
 *
 * Examples:
 *   memi update @acme/design-system         # update only components from this registry
 *   memi update                             # update all registry-sourced components (reads --from from package.json or prompts)
 */

import type { Command } from "commander";
import type { MemoireEngine } from "../engine/core.js";
import ora from "ora";
import { ui } from "../tui/format.js";
import { resolveRegistry } from "../registry/resolver.js";
import { installComponent } from "../registry/installer.js";
import { formatElapsed } from "../utils/format.js";

export interface UpdatePayload {
  status: "updated" | "failed" | "empty";
  registry: string;
  version: string;
  updated: string[];
  skipped: string[];
  errors: Array<{ component: string; error: string }>;
  elapsedMs: number;
}

export function registerUpdateCommand(program: Command, engine: MemoireEngine) {
  program
    .command("update <registry>")
    .description("Re-install all components previously installed from a registry (fetches latest versions)")
    .option("--tokens", "Also refresh tokens.css")
    .option("--json", "Output as JSON")
    .action(async (registryRef: string, opts: { tokens?: boolean; json?: boolean }) => {
      const start = Date.now();
      await engine.init();

      const spinner = opts.json ? null : ora({
        text: `Resolving ${registryRef}...`, indent: 2, color: "cyan",
      }).start();

      let resolved;
      try {
        resolved = await resolveRegistry(registryRef, engine.config.projectRoot);
      } catch (err) {
        spinner?.stop();
        const msg = err instanceof Error ? err.message : String(err);
        const payload: UpdatePayload = {
          status: "failed", registry: registryRef, version: "",
          updated: [], skipped: [], errors: [{ component: "", error: msg }],
          elapsedMs: Date.now() - start,
        };
        if (opts.json) console.log(JSON.stringify(payload, null, 2));
        else console.log(`\n  ${ui.fail(msg)}\n`);
        process.exitCode = 1;
        return;
      }

      // Find locally-installed components that match this registry
      const localSpecs = await engine.registry.getAllSpecs();
      const localNames = new Set(localSpecs.filter(s => s.type === "component").map(s => s.name));
      const registryNames = resolved.registry.components.map(c => c.name);
      const toUpdate = registryNames.filter(n => localNames.has(n));

      spinner?.stop();

      if (toUpdate.length === 0) {
        const payload: UpdatePayload = {
          status: "empty", registry: registryRef, version: resolved.registry.version,
          updated: [], skipped: [], errors: [], elapsedMs: Date.now() - start,
        };
        if (opts.json) console.log(JSON.stringify(payload, null, 2));
        else {
          console.log();
          console.log(ui.dim(`  No installed components match ${registryRef}.`));
          console.log(ui.dim(`  Install one first:  memi add <Component> --from ${registryRef}`));
          console.log();
        }
        return;
      }

      const updated: string[] = [];
      const errors: UpdatePayload["errors"] = [];

      if (!opts.json) {
        console.log();
        console.log(ui.section(`UPDATE  ${resolved.registry.name}@${resolved.registry.version}`));
      }

      for (const name of toUpdate) {
        try {
          await installComponent(engine, {
            from: registryRef,
            name,
            withTokens: opts.tokens,
          });
          updated.push(name);
          if (!opts.json) console.log(ui.ok(name));
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push({ component: name, error: msg });
          if (!opts.json) console.log(ui.fail(`${name}  ${ui.dim(msg)}`));
        }
      }

      const payload: UpdatePayload = {
        status: errors.length === toUpdate.length ? "failed" : "updated",
        registry: registryRef,
        version: resolved.registry.version,
        updated,
        skipped: [],
        errors,
        elapsedMs: Date.now() - start,
      };

      if (opts.json) {
        console.log(JSON.stringify(payload, null, 2));
        return;
      }

      console.log();
      console.log(ui.ok(`${updated.length}/${toUpdate.length} components updated`) + ui.dim(`  (${formatElapsed(Date.now() - start)})`));
      console.log();
    });
}
