/**
 * WA-405 — pull --wcag integration tests
 * Covers: exit code 2 on failures, JSON payload includes wcagReport,
 * no failures keep exitCode 0, REST + wcag path, summary output shape.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { Command } from "commander";
import { registerPullCommand } from "../pull.js";
import { captureLogs } from "./test-helpers.js";

vi.mock("../../engine/token-differ.js", () => ({
  diffDesignSystem: () => ({
    hasChanges: false,
    summary: "No changes",
    tokens: [],
    components: [],
    styles: [],
  }),
}));

afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = 0;
});

// ── Helpers ───────────────────────────────────────────────────────

/** Token with a hex that fails contrast (<3:1 against white and black). */
const FAIL_TOKEN = {
  name: "color/muted",
  collection: "Design Tokens",
  type: "color" as const,
  values: { default: "#e8e8e8" },
  cssVariable: "--color-muted",
};

/** Token with a high-contrast hex (passes). */
const PASS_TOKEN = {
  name: "color/primary",
  collection: "Design Tokens",
  type: "color" as const,
  values: { default: "#000000" },
  cssVariable: "--color-primary",
};

/** Token that is warn-level (~4.48:1). */
const WARN_TOKEN = {
  name: "color/subtle",
  collection: "Design Tokens",
  type: "color" as const,
  values: { default: "#767676" },
  cssVariable: "--color-subtle",
};

function makeWcagEngine(tokens: unknown[] = []) {
  const ds = {
    tokens,
    components: [],
    styles: [],
    lastSync: new Date().toISOString(),
  };

  return {
    async init() {},
    figma: { isConnected: true },
    async pullDesignSystem() {},
    async pullDesignSystemREST() {},
    async ensureFigmaConnected() {},
    registry: {
      designSystem: ds,
      async getAllSpecs() { return []; },
    },
    snapshotDesignSystem() { return { ...ds }; },
  };
}

// ── exit code 2 on failures ───────────────────────────────────────

describe("pull --wcag — exit code", () => {
  it("sets process.exitCode to 2 when audit finds failures", async () => {
    captureLogs();
    const engine = makeWcagEngine([FAIL_TOKEN]);
    const program = new Command();
    registerPullCommand(program, engine as never);
    await program.parseAsync(["pull", "--wcag", "--json"], { from: "user" });
    expect(process.exitCode).toBe(2);
  });

  it("does NOT set exitCode to 2 when all tokens pass", async () => {
    captureLogs();
    const engine = makeWcagEngine([PASS_TOKEN]);
    const program = new Command();
    registerPullCommand(program, engine as never);
    await program.parseAsync(["pull", "--wcag", "--json"], { from: "user" });
    expect(process.exitCode).not.toBe(2);
    expect(process.exitCode).toBeFalsy();
  });

  it("does NOT set exitCode to 2 with only warn-level tokens (no failures)", async () => {
    captureLogs();
    const engine = makeWcagEngine([WARN_TOKEN]);
    const program = new Command();
    registerPullCommand(program, engine as never);
    await program.parseAsync(["pull", "--wcag", "--json"], { from: "user" });
    expect(process.exitCode).not.toBe(2);
  });

  it("exit code remains 0 when no tokens are present", async () => {
    captureLogs();
    const engine = makeWcagEngine([]);
    const program = new Command();
    registerPullCommand(program, engine as never);
    await program.parseAsync(["pull", "--wcag", "--json"], { from: "user" });
    expect(process.exitCode).toBeFalsy();
  });
});

// ── --wcag --json includes wcagReport ────────────────────────────

describe("pull --wcag --json — payload", () => {
  it("includes wcagReport in JSON payload", async () => {
    const logs = captureLogs();
    const engine = makeWcagEngine([PASS_TOKEN]);
    const program = new Command();
    registerPullCommand(program, engine as never);
    await program.parseAsync(["pull", "--wcag", "--json"], { from: "user" });
    const payload = JSON.parse(logs.at(-1)!);
    expect(payload.wcagReport).toBeDefined();
  });

  it("wcagReport has results, summary, and hasFailures", async () => {
    const logs = captureLogs();
    const engine = makeWcagEngine([PASS_TOKEN]);
    const program = new Command();
    registerPullCommand(program, engine as never);
    await program.parseAsync(["pull", "--wcag", "--json"], { from: "user" });
    const { wcagReport } = JSON.parse(logs.at(-1)!);
    expect(Array.isArray(wcagReport.results)).toBe(true);
    expect(typeof wcagReport.summary).toBe("object");
    expect(typeof wcagReport.hasFailures).toBe("boolean");
  });

  it("wcagReport.hasFailures is true when a failing token is present", async () => {
    const logs = captureLogs();
    const engine = makeWcagEngine([FAIL_TOKEN]);
    const program = new Command();
    registerPullCommand(program, engine as never);
    await program.parseAsync(["pull", "--wcag", "--json"], { from: "user" });
    const { wcagReport } = JSON.parse(logs.at(-1)!);
    expect(wcagReport.hasFailures).toBe(true);
  });

  it("wcagReport.hasFailures is false when only passing tokens are present", async () => {
    const logs = captureLogs();
    const engine = makeWcagEngine([PASS_TOKEN]);
    const program = new Command();
    registerPullCommand(program, engine as never);
    await program.parseAsync(["pull", "--wcag", "--json"], { from: "user" });
    const { wcagReport } = JSON.parse(logs.at(-1)!);
    expect(wcagReport.hasFailures).toBe(false);
  });

  it("wcagReport.summary.total matches token count", async () => {
    const logs = captureLogs();
    const engine = makeWcagEngine([PASS_TOKEN, FAIL_TOKEN, WARN_TOKEN]);
    const program = new Command();
    registerPullCommand(program, engine as never);
    await program.parseAsync(["pull", "--wcag", "--json"], { from: "user" });
    const { wcagReport } = JSON.parse(logs.at(-1)!);
    expect(wcagReport.summary.total).toBe(3);
  });

  it("wcagReport NOT included in payload when --wcag is absent", async () => {
    const logs = captureLogs();
    const engine = makeWcagEngine([FAIL_TOKEN]);
    const program = new Command();
    registerPullCommand(program, engine as never);
    await program.parseAsync(["pull", "--json"], { from: "user" });
    const payload = JSON.parse(logs.at(-1)!);
    expect(payload.wcagReport).toBeUndefined();
  });
});

// ── pull --rest --wcag ────────────────────────────────────────────

describe("pull --rest --wcag", () => {
  it("runs audit on REST-pulled data", async () => {
    const logs = captureLogs();
    const engine = makeWcagEngine([FAIL_TOKEN]);
    const program = new Command();
    registerPullCommand(program, engine as never);
    await program.parseAsync(["pull", "--rest", "--wcag", "--json"], { from: "user" });
    const payload = JSON.parse(logs.at(-1)!);
    expect(payload.wcagReport).toBeDefined();
    expect(payload.wcagReport.hasFailures).toBe(true);
  });

  it("sets exit code 2 on REST pull with failing tokens", async () => {
    captureLogs();
    const engine = makeWcagEngine([FAIL_TOKEN]);
    const program = new Command();
    registerPullCommand(program, engine as never);
    await program.parseAsync(["pull", "--rest", "--wcag", "--json"], { from: "user" });
    expect(process.exitCode).toBe(2);
  });

  it("does not set exit code 2 on REST pull with no failures", async () => {
    captureLogs();
    const engine = makeWcagEngine([PASS_TOKEN]);
    const program = new Command();
    registerPullCommand(program, engine as never);
    await program.parseAsync(["pull", "--rest", "--wcag", "--json"], { from: "user" });
    expect(process.exitCode).not.toBe(2);
  });

  it("--rest --wcag --json includes diff field alongside wcagReport", async () => {
    const logs = captureLogs();
    const engine = makeWcagEngine([PASS_TOKEN]);
    const program = new Command();
    registerPullCommand(program, engine as never);
    await program.parseAsync(["pull", "--rest", "--wcag", "--json"], { from: "user" });
    const payload = JSON.parse(logs.at(-1)!);
    expect(payload.diff).toBeDefined();
    expect(payload.wcagReport).toBeDefined();
  });
});

// ── console output (non-json mode) ───────────────────────────────

describe("pull --wcag (text output)", () => {
  it("prints 'wcag audit' summary line to console", async () => {
    const logs = captureLogs();
    // Use REST mode to skip plugin connection
    const engine = makeWcagEngine([PASS_TOKEN]);
    const program = new Command();
    registerPullCommand(program, engine as never);
    await program.parseAsync(["pull", "--rest", "--wcag"], { from: "user" });
    const joined = logs.join("\n");
    expect(joined).toContain("wcag audit");
  });

  it("prints [fail] lines when failures exist in text mode", async () => {
    const logs = captureLogs();
    const engine = makeWcagEngine([FAIL_TOKEN]);
    const program = new Command();
    registerPullCommand(program, engine as never);
    await program.parseAsync(["pull", "--rest", "--wcag"], { from: "user" });
    const joined = logs.join("\n");
    expect(joined).toContain("[fail]");
  });
});
