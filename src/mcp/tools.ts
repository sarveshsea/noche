/**
 * MCP Tool registrations for Mémoire.
 *
 * Each tool wraps an existing engine method and returns structured
 * CallToolResult payloads. Errors are caught and returned as
 * { isError: true } per MCP convention.
 */

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MemoireEngine } from "../engine/core.js";
import { AgentOrchestrator } from "../agents/orchestrator.js";
import { ComponentSpecSchema, PageSpecSchema, DataVizSpecSchema } from "../specs/types.js";

function requireFigma(engine: MemoireEngine): void {
  if (!engine.figma.isConnected) {
    throw new Error("Figma not connected. Start the daemon (`memi daemon start`) or connect (`memi connect`) first.");
  }
}

export function registerTools(server: McpServer, engine: MemoireEngine): void {
  // ── pull_design_system ──────────────────────────────────
  server.tool(
    "pull_design_system",
    "Pull the full design system (tokens, components, styles) from the connected Figma file into the local registry",
    {},
    async () => {
      requireFigma(engine);
      await engine.pullDesignSystem();
      const ds = engine.registry.designSystem;
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            tokens: ds.tokens.length,
            components: ds.components.length,
            styles: ds.styles.length,
            lastSync: ds.lastSync,
          }, null, 2),
        }],
      };
    },
  );

  // ── get_specs ───────────────────────────────────────────
  server.tool(
    "get_specs",
    "List all specs in the project (component, page, dataviz, design, ia)",
    {},
    async () => {
      const specs = await engine.registry.getAllSpecs();
      return {
        content: [{
          type: "text",
          text: JSON.stringify(specs.map((s) => ({
            name: s.name,
            type: s.type,
            purpose: "purpose" in s ? s.purpose : undefined,
          })), null, 2),
        }],
      };
    },
  );

  // ── get_spec ────────────────────────────────────────────
  server.tool(
    "get_spec",
    "Get a single spec by name with full details",
    { name: z.string().describe("Spec name") },
    async ({ name }) => {
      const spec = await engine.registry.getSpec(name);
      if (!spec) {
        return { isError: true, content: [{ type: "text" as const, text: `Spec "${name}" not found` }] };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(spec, null, 2) }] };
    },
  );

  // ── create_spec ─────────────────────────────────────────
  server.tool(
    "create_spec",
    "Create or update a spec. Pass a JSON string matching ComponentSpec, PageSpec, or DataVizSpec schema.",
    { spec: z.string().describe("JSON string of the spec object") },
    async ({ spec: specJson }) => {
      const raw = JSON.parse(specJson);
      let parsed;
      switch (raw.type) {
        case "component": parsed = ComponentSpecSchema.parse(raw); break;
        case "page": parsed = PageSpecSchema.parse(raw); break;
        case "dataviz": parsed = DataVizSpecSchema.parse(raw); break;
        default: throw new Error(`Unknown spec type: ${raw.type}. Must be component, page, or dataviz.`);
      }
      await engine.registry.saveSpec(parsed);
      return { content: [{ type: "text" as const, text: `Spec "${parsed.name}" saved (${parsed.type})` }] };
    },
  );

  // ── generate_code ───────────────────────────────────────
  server.tool(
    "generate_code",
    "Generate code from a spec. Returns the entry file path and list of generated files.",
    { specName: z.string().describe("Name of the spec to generate code for") },
    async ({ specName }) => {
      const entryFile = await engine.generateFromSpec(specName);
      const gen = engine.registry.getGenerationState(specName);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            entryFile,
            files: gen?.files ?? [],
            generatedAt: gen?.generatedAt,
          }, null, 2),
        }],
      };
    },
  );

  // ── get_tokens ──────────────────────────────────────────
  server.tool(
    "get_tokens",
    "Get all design tokens from the local registry (colors, spacing, typography, etc.)",
    {},
    async () => ({
      content: [{
        type: "text" as const,
        text: JSON.stringify(engine.registry.designSystem.tokens, null, 2),
      }],
    }),
  );

  // ── update_token ────────────────────────────────────────
  server.tool(
    "update_token",
    "Update a design token value in the registry and optionally push to Figma",
    {
      name: z.string().describe("Token name to update"),
      values: z.record(z.union([z.string(), z.number()])).describe("Mode-value pairs, e.g. { \"Light\": \"#FF0000\" }"),
      pushToFigma: z.boolean().default(false).describe("Whether to push the change to Figma"),
    },
    async ({ name, values, pushToFigma }) => {
      const token = engine.registry.designSystem.tokens.find((t) => t.name === name);
      if (!token) {
        return { isError: true, content: [{ type: "text" as const, text: `Token "${name}" not found` }] };
      }
      const updated = { ...token, values: { ...token.values, ...values } };
      engine.registry.updateToken(name, updated);

      if (pushToFigma && engine.figma.isConnected) {
        const orchestrator = new AgentOrchestrator(engine);
        await (orchestrator as any).pushTokenToFigma?.(updated);
      }

      return { content: [{ type: "text" as const, text: `Token "${name}" updated` }] };
    },
  );

  // ── capture_screenshot ──────────────────────────────────
  server.tool(
    "capture_screenshot",
    "Capture a screenshot of a Figma node (or the full page if no nodeId given)",
    {
      nodeId: z.string().optional().describe("Figma node ID to capture. Omit for full page."),
      format: z.enum(["PNG", "SVG"]).default("PNG"),
      scale: z.number().default(2),
    },
    async ({ nodeId, format, scale }) => {
      requireFigma(engine);
      const result = await engine.figma.captureScreenshot(nodeId, format, scale);
      return {
        content: [{
          type: "image" as const,
          data: result.base64,
          mimeType: format === "SVG" ? "image/svg+xml" : "image/png",
        }],
      };
    },
  );

  // ── get_selection ───────────────────────────────────────
  server.tool(
    "get_selection",
    "Get the current Figma selection (selected nodes with properties, styles, layout info)",
    {},
    async () => {
      requireFigma(engine);
      const selection = await engine.figma.getSelection();
      return { content: [{ type: "text" as const, text: JSON.stringify(selection, null, 2) }] };
    },
  );

  // ── compose ─────────────────────────────────────────────
  server.tool(
    "compose",
    "Run the agent orchestrator with a natural language intent. Classifies, plans, and executes design tasks.",
    {
      intent: z.string().describe("Natural language design intent, e.g. 'create a dashboard with KPI cards'"),
      dryRun: z.boolean().default(false).describe("If true, return the plan without executing"),
    },
    async ({ intent, dryRun }) => {
      const orchestrator = new AgentOrchestrator(engine);
      const result = await orchestrator.execute(intent, { dryRun });
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  // ── run_audit ───────────────────────────────────────────
  server.tool(
    "run_audit",
    "Run a design system audit via the agent orchestrator",
    {
      focus: z.string().optional().describe("Optional focus area, e.g. 'accessibility', 'token coverage', 'naming'"),
    },
    async ({ focus }) => {
      const intent = focus ? `design-audit focusing on ${focus}` : "design-audit";
      const orchestrator = new AgentOrchestrator(engine);
      const result = await orchestrator.execute(intent);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  // ── get_research ────────────────────────────────────────
  server.tool(
    "get_research",
    "Get the research store (insights, personas, themes, sources)",
    {},
    async () => {
      await engine.research.load();
      const store = engine.research.getStore();
      return { content: [{ type: "text" as const, text: JSON.stringify(store, null, 2) }] };
    },
  );

  // ── figma_execute ───────────────────────────────────────
  server.tool(
    "figma_execute",
    "Execute arbitrary Figma Plugin API code on the connected plugin (sandboxed). Returns the result.",
    { code: z.string().describe("JavaScript code to execute in the Figma plugin sandbox") },
    async ({ code }) => {
      requireFigma(engine);
      const result = await engine.figma.execute(code);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  // ── get_page_tree ───────────────────────────────────────
  server.tool(
    "get_page_tree",
    "Get the Figma page tree structure (pages, frames, components) up to a given depth",
    { depth: z.number().default(2).describe("Max depth to traverse (default 2)") },
    async ({ depth }) => {
      requireFigma(engine);
      const tree = await engine.figma.getPageTree(depth);
      return { content: [{ type: "text" as const, text: JSON.stringify(tree, null, 2) }] };
    },
  );
}
