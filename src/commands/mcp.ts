/**
 * CLI command: memi mcp — Start Mémoire as an MCP server (stdio transport).
 */

import type { Command } from "commander";
import type { MemoireEngine } from "../engine/core.js";
import { startStdioMcpServer } from "../mcp/server.js";

export function registerMcpCommand(program: Command, engine: MemoireEngine): void {
  program
    .command("mcp")
    .description("Start Mémoire as an MCP server (stdio transport for Claude Code, Cursor, etc.)")
    .option("--no-figma", "Skip Figma bridge connection")
    .action(async (opts) => {
      await startStdioMcpServer(engine, opts.figma !== false);
    });
}
