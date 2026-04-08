/**
 * Memoire TUI Format — shared visual language for all CLI output.
 *
 * Design language:
 * ◆  Diamond mark — brand symbol
 * ┌─[ TITLE ]───┐  Bracket-titled boxes
 * [+] [-] [!] [x] [>]  Status sprites
 * Label ········ value  Dot leaders
 * SECTION ──────────  Section rules
 * ▸  Prompt indicator
 * [████░░░░]  Block progress
 */

import chalk from "chalk";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// ── Version ─────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));

let _version: string | undefined;

export function getVersion(): string {
  if (!_version) {
    try {
      const raw = readFileSync(join(__dirname, "../../package.json"), "utf-8");
      _version = JSON.parse(raw).version as string;
    } catch {
      _version = "0.0.0";
    }
  }
  return _version;
}

// ── Constants ───────────────────────────────────────────

const RULE_W = 56;

// ── Internals ───────────────────────────────────────────

// eslint-disable-next-line no-control-regex
const ANSI_RE = /\x1b\[[0-9;]*m/g;

function strip(text: string): string {
  return text.replace(ANSI_RE, "");
}

function vLen(text: string): number {
  return strip(text).length;
}

function padR(text: string, width: number): string {
  const gap = width - vLen(text);
  return gap > 0 ? text + " ".repeat(gap) : text;
}

// ── Exports ─────────────────────────────────────────────

export const ui = {

  // ── Brand ───────────────────────────────────────────

  /**
   * Brand header:
   *
   *   ◆ M E M O I R E                              v0.3.0
   *   ──────────────────────────────────────────────────────
   *   subtitle text
   */
  brand(subtitle?: string): string {
    const ver = chalk.dim("v" + getVersion());
    const mark = chalk.bold("◆ M E M O I R E");
    const gap = Math.max(1, RULE_W - vLen(mark) - vLen(ver));
    const lines = [
      "",
      "  " + mark + " ".repeat(gap) + ver,
      "  " + chalk.dim("─".repeat(RULE_W)),
    ];
    if (subtitle) {
      lines.push("  " + chalk.dim(subtitle));
    }
    lines.push("");
    return lines.join("\n");
  },

  // ── Boxes ───────────────────────────────────────────

  /**
   * Bracket-titled box:
   *
   *   ┌─[ TITLE ]────────────────────────────────────────┐
   *   │                                                   │
   *   │  content line                                     │
   *   │                                                   │
   *   └───────────────────────────────────────────────────┘
   */
  box(title: string, lines: string[], width = RULE_W): string {
    const inner = width - 2;
    const label = "─[ " + chalk.bold(title) + " ]";
    const labelLen = vLen(label);
    const topDashes = Math.max(0, inner - labelLen);
    const top = "┌" + label + "─".repeat(topDashes) + "┐";
    const bot = "└" + "─".repeat(inner) + "┘";
    const empty = "│" + " ".repeat(inner) + "│";
    const rows = lines.map((l) => "│  " + padR(l, inner - 2) + "│");

    return [
      "  " + top,
      "  " + empty,
      ...rows.map((r) => "  " + r),
      "  " + empty,
      "  " + bot,
    ].join("\n");
  },

  /**
   * Instruction box (dimmed borders):
   *
   *   ┌──────────────────────────────────────────────────┐
   *   │  1. Step one                                     │
   *   │  2. Step two                                     │
   *   └──────────────────────────────────────────────────┘
   */
  instructions(lines: string[], width = RULE_W): string {
    const inner = width - 2;
    const d = chalk.dim;
    const top = d("┌" + "─".repeat(inner) + "┐");
    const bot = d("└" + "─".repeat(inner) + "┘");
    const rows = lines.map((l) => d("│") + "  " + padR(l, inner - 2) + d("│"));

    return [
      "  " + top,
      ...rows.map((r) => "  " + r),
      "  " + bot,
    ].join("\n");
  },

  // ── Section ─────────────────────────────────────────

  /** Section rule:  LABEL ──────────────────────── */
  section(label: string): string {
    const upper = chalk.bold(label.toUpperCase());
    const remaining = Math.max(0, RULE_W - vLen(upper) - 1);
    return "\n  " + upper + " " + chalk.dim("─".repeat(remaining));
  },

  // ── Dot leaders ─────────────────────────────────────

  /** Label ·························· value */
  dots(label: string, value: string, width = RULE_W): string {
    const vStr = String(value);
    const available = width - label.length - vLen(vStr) - 2;
    const fill = available > 2
      ? " " + chalk.dim("·".repeat(available)) + " "
      : "  ";
    return "  " + label + fill + vStr;
  },

  // ── Status sprites ──────────────────────────────────

  /** [+] success */
  ok(text: string): string {
    return "  " + chalk.green("[+]") + " " + text;
  },

  /** [-] skipped */
  skip(text: string): string {
    return "  " + chalk.dim("[-]") + " " + chalk.dim(text);
  },

  /** [!] warning */
  warn(text: string): string {
    return "  " + chalk.yellow("[!]") + " " + text;
  },

  /** [x] error */
  fail(text: string): string {
    return "  " + chalk.red("[x]") + " " + text;
  },

  /** [>] active/running */
  active(text: string): string {
    return "  " + chalk.cyan("[>]") + " " + text;
  },

  /** [.] pending */
  pending(text: string): string {
    return "  " + chalk.dim("[.]") + " " + chalk.dim(text);
  },

  // ── Progress ────────────────────────────────────────

  /**
   * Block progress bar:  [████████░░░░]  67%
   */
  progress(current: number, total: number, width = 20): string {
    if (total === 0) return chalk.dim("[" + "░".repeat(width) + "]  0%");
    const ratio = Math.min(current / total, 1);
    const filled = Math.round(ratio * width);
    const empty = width - filled;
    const pct = Math.round(ratio * 100);
    return chalk.green("█".repeat(filled)) + chalk.dim("░".repeat(empty)) + "  " + pct + "%";
  },

  // ── Guides ──────────────────────────────────────────

  /** command ··················· description */
  guide(cmd: string, desc: string, width = RULE_W): string {
    const cmdStr = chalk.bold(cmd);
    const available = width - vLen(cmdStr) - desc.length - 2;
    const fill = available > 2
      ? " " + chalk.dim("·".repeat(available)) + " "
      : " ";
    return "  " + cmdStr + fill + chalk.dim(desc);
  },

  // ── Prompt ──────────────────────────────────────────

  /** ▸ prompt text */
  promptPrefix(): string {
    return chalk.cyan("▸");
  },

  // ── Event log ───────────────────────────────────────

  /** 12:34:56  + ACTION — detail */
  event(symbol: "+" | "x" | "·", action: string, detail: string): string {
    const ts = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const sym = symbol === "+"
      ? chalk.green("+")
      : symbol === "x"
        ? chalk.red("x")
        : chalk.dim("·");
    return "  " + chalk.dim(ts) + "  " + sym + " " + chalk.bold(action) + chalk.dim(" — ") + detail;
  },

  // ── Ready marker ────────────────────────────────────

  /** ◆ LABEL */
  ready(label: string): string {
    return "  " + chalk.green("◆") + " " + chalk.bold(label.toUpperCase());
  },

  // ── Color shortcuts ─────────────────────────────────

  dim: chalk.dim,
  bold: chalk.bold,
  green: chalk.green,
  yellow: chalk.yellow,
  red: chalk.red,
  cyan: chalk.cyan,

  // ── Table ───────────────────────────────────────────

  /**
   * Render an aligned dot-leader table and print each row.
   *
   * printTable([["Framework", "Next.js"], ["Language", "TypeScript"]])
   *
   *   Framework ·················· Next.js
   *   Language ··················· TypeScript
   *
   * @param rows   Array of [label, value] pairs.
   * @param opts   Optional indent level (default 0 = 2-space prefix from dots()).
   */
  printTable(rows: [string, string][], opts?: { indent?: number }): void {
    const indent = opts?.indent ?? 0;
    const prefix = " ".repeat(indent * 2);
    for (const [label, value] of rows) {
      const line = ui.dots(label, value);
      // dots() already applies 2-space prefix; extra indent stacks on top
      console.log(prefix + line.trimStart());
    }
  },

  // ── Utility ─────────────────────────────────────────

  /** 2n-space indented text */
  indent(text: string, level = 1): string {
    return " ".repeat(level * 2) + text;
  },

  /** Blank line */
  gap(): void {
    console.log();
  },

  /** Horizontal rule */
  rule(): string {
    return "  " + chalk.dim("─".repeat(RULE_W));
  },
};
