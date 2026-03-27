import type { Command } from "commander";
import type { MemoireEngine } from "../engine/core.js";
import { hasAI, getTracker } from "../ai/index.js";

export interface StatusPayload {
  project: {
    framework: string;
    language: string;
    tailwind: boolean;
    tailwindVersion?: string;
    shadcnInstalled: boolean;
    shadcnComponents: number;
  };
  figma: {
    connected: boolean;
    tokens: number;
    components: number;
    styles: number;
    lastSync: string;
  };
  specs: {
    components: number;
    pages: number;
    dataviz: number;
    generated: number;
    total: number;
  };
  research: {
    insights: number;
    themes: number;
    sources: number;
    highConfidence: number;
  };
  ai: {
    apiKey: boolean;
    calls: number;
    usage: string | null;
    mode: string;
  };
  notes: {
    builtIn: number;
    installed: number;
    total: number;
  };
}

export function registerStatusCommand(program: Command, engine: MemoireEngine) {
  program
    .command("status")
    .description("Show project status")
    .option("--json", "Output status as JSON")
    .action(async (opts: { json?: boolean }) => {
      const payload = await collectStatus(engine);

      if (opts.json) {
        console.log(JSON.stringify(payload, null, 2));
        return;
      }

      printStatus(payload);
    });
}

export async function collectStatus(engine: MemoireEngine): Promise<StatusPayload> {
  await engine.init();
  await engine.research.load();
  if (!engine.notes.loaded) await engine.notes.loadAll();

  const project = engine.project;
  const specs = await engine.registry.getAllSpecs();
  const ds = engine.registry.designSystem;
  const research = engine.research.getStore();

  const components = specs.filter((s) => s.type === "component");
  const pages = specs.filter((s) => s.type === "page");
  const dataviz = specs.filter((s) => s.type === "dataviz");
  const generated = specs.filter((s) => engine.registry.getGenerationState(s.name));
  const highConfidence = research.insights.filter((i) => i.confidence === "high").length;

  const allNotes = engine.notes.notes;
  const builtInCount = allNotes.filter((n) => n.builtIn).length;
  const installedCount = allNotes.filter((n) => !n.builtIn).length;

  const tracker = getTracker();

  return {
    project: {
      framework: project?.framework ?? "not detected",
      language: project?.language ?? "unknown",
      tailwind: project?.styling.tailwind ?? false,
      tailwindVersion: project?.styling.tailwindVersion,
      shadcnInstalled: project?.shadcn.installed ?? false,
      shadcnComponents: project?.shadcn.components.length ?? 0,
    },
    figma: {
      connected: engine.figma.isConnected,
      tokens: ds.tokens.length,
      components: ds.components.length,
      styles: ds.styles.length,
      lastSync: ds.lastSync,
    },
    specs: {
      components: components.length,
      pages: pages.length,
      dataviz: dataviz.length,
      generated: generated.length,
      total: specs.length,
    },
    research: {
      insights: research.insights.length,
      themes: research.themes.length,
      sources: research.sources.length,
      highConfidence,
    },
    ai: {
      apiKey: hasAI(),
      calls: tracker?.callCount ?? 0,
      usage: tracker?.summary ?? null,
      mode: tracker ? "direct-api" : "agent-cli",
    },
    notes: {
      builtIn: builtInCount,
      installed: installedCount,
      total: allNotes.length,
    },
  };
}

function printStatus(payload: StatusPayload): void {
  console.log("\n  ┌─────────────────────────────────────────┐");
  console.log("  │            Memoire Project Status            │");
  console.log("  └─────────────────────────────────────────┘\n");

  console.log("  Project");
  console.log(`    Framework:    ${payload.project.framework}`);
  console.log(`    Language:     ${payload.project.language}`);
  console.log(`    Tailwind:     ${payload.project.tailwind ? "yes" : "no"}`);
  console.log(`    shadcn:       ${payload.project.shadcnInstalled ? `yes (${payload.project.shadcnComponents} components)` : "no"}`);

  console.log("\n  Figma");
  console.log(`    Connected:    ${payload.figma.connected ? "yes" : "no"}`);
  console.log(`    Tokens:       ${payload.figma.tokens}`);
  console.log(`    Components:   ${payload.figma.components}`);
  console.log(`    Styles:       ${payload.figma.styles}`);
  console.log(`    Last sync:    ${payload.figma.lastSync}`);

  console.log("\n  Specs");
  console.log(`    Components:   ${payload.specs.components}`);
  console.log(`    Pages:        ${payload.specs.pages}`);
  console.log(`    DataViz:      ${payload.specs.dataviz}`);
  console.log(`    Generated:    ${payload.specs.generated}/${payload.specs.total}`);

  console.log("\n  Research");
  console.log(`    Insights:     ${payload.research.insights}`);
  console.log(`    Themes:       ${payload.research.themes}`);
  console.log(`    Sources:      ${payload.research.sources}`);
  if (payload.research.highConfidence > 0) {
    console.log(`    High conf:    ${payload.research.highConfidence}`);
  }

  console.log("\n  AI");
  console.log(`    API key:      ${payload.ai.apiKey ? "set" : "not set"}`);
  if (payload.ai.usage) {
    console.log(`    Calls:        ${payload.ai.calls}`);
    console.log(`    Usage:        ${payload.ai.usage}`);
  } else {
    console.log("    Status:       Agent CLI mode (no direct API)");
  }

  console.log("\n  Notes");
  console.log(`    Built-in:     ${payload.notes.builtIn}`);
  console.log(`    Installed:    ${payload.notes.installed}`);
  console.log(`    Total:        ${payload.notes.total}`);
  console.log();
}
