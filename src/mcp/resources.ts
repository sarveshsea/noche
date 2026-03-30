/**
 * MCP Resource registrations for Mémoire.
 *
 * Exposes design system state, individual specs, and project context
 * as MCP resources that AI tools can read.
 */

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MemoireEngine } from "../engine/core.js";

export function registerResources(server: McpServer, engine: MemoireEngine): void {
  // ── memoire://design-system ─────────────────────────────
  server.resource(
    "design-system",
    "memoire://design-system",
    { description: "Current design system: tokens, components, styles, and last sync timestamp" },
    async () => ({
      contents: [{
        uri: "memoire://design-system",
        mimeType: "application/json",
        text: JSON.stringify(engine.registry.designSystem, null, 2),
      }],
    }),
  );

  // ── memoire://specs/{name} ──────────────────────────────
  server.resource(
    "spec",
    new ResourceTemplate("memoire://specs/{name}", { list: async () => {
      const specs = await engine.registry.getAllSpecs();
      return {
        resources: specs.map((s) => ({
          uri: `memoire://specs/${encodeURIComponent(s.name)}`,
          name: s.name,
          description: `${s.type} spec: ${s.purpose ?? s.name}`,
          mimeType: "application/json" as const,
        })),
      };
    }}),
    { description: "Individual spec by name (component, page, dataviz, design, or ia)" },
    async (uri, { name }) => {
      const specName = decodeURIComponent(String(name));
      const spec = await engine.registry.getSpec(specName);
      if (!spec) {
        throw new Error(`Spec "${specName}" not found`);
      }
      return {
        contents: [{
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(spec, null, 2),
        }],
      };
    },
  );

  // ── memoire://project ───────────────────────────────────
  server.resource(
    "project",
    "memoire://project",
    { description: "Detected project context: framework, styling, shadcn status, Tailwind config" },
    async () => ({
      contents: [{
        uri: "memoire://project",
        mimeType: "application/json",
        text: JSON.stringify(engine.project ?? { error: "Project not yet detected. Run engine.init() first." }, null, 2),
      }],
    }),
  );
}
