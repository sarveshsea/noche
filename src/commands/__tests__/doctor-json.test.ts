import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Command } from "commander";
import { registerDoctorCommand } from "../doctor.js";

const { accessMock, readdirMock } = vi.hoisted(() => ({
  accessMock: vi.fn(async (path: unknown) => {
    const value = String(path);
    if (value.includes(".memoire")) {
      throw new Error("missing workspace");
    }
  }),
  readdirMock: vi.fn(async () => ["index.html", "notes.md"]),
}));

vi.mock("fs/promises", () => ({
  access: accessMock,
  readdir: readdirMock,
  constants: {
    R_OK: 4,
    W_OK: 2,
  },
}));

afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = 0;
});

beforeEach(() => {
  accessMock.mockClear();
  readdirMock.mockClear();
});

describe("doctor --json", () => {
  it("emits structured check results and summary counts", async () => {
    const logs = captureLogs();
    const engine = makeDoctorEngine();
    const program = new Command();

    registerDoctorCommand(program, engine as never);
    await program.parseAsync(["doctor", "--json"], { from: "user" });

    const payload = JSON.parse(lastLog(logs));
    const checks = getChecks(payload);
    const summary = getSummary(payload, checks);

    expect(checks).toHaveLength(9);
    expect(summary).toMatchObject({
      pass: 6,
      warn: 2,
      fail: 1,
      total: 9,
    });
    expect(statusMap(checks)).toEqual({
      "Project detected": "pass",
      "Design system": "pass",
      Specs: "warn",
      "Token coverage": "pass",
      "Figma bridge": "warn",
      Preview: "pass",
      Node: "pass",
      Dependencies: "pass",
      Workspace: "fail",
    });
    expect(detailMap(checks).get("Specs")).toContain("missing shadcnBase");
  });

  it("keeps the JSON payload stable for mixed pass and warning checks", async () => {
    const logs = captureLogs();
    const engine = makeDoctorEngine();
    const program = new Command();

    registerDoctorCommand(program, engine as never);
    await program.parseAsync(["doctor", "--json"], { from: "user" });

    const payload = JSON.parse(lastLog(logs));
    const checks = getChecks(payload);

    expect(checks.every((check: { label: string; status: string; detail: string }) =>
      typeof check.label === "string" &&
      typeof check.status === "string" &&
      typeof check.detail === "string"
    )).toBe(true);
    expect(getSummary(payload, checks).total).toBe(checks.length);
  });
});

function makeDoctorEngine() {
  return {
    async init() {},
    config: {
      projectRoot: "/workspace",
    },
    project: {
      framework: "vite",
      styling: { tailwind: true },
    },
    registry: {
      designSystem: {
        tokens: [
          { name: "color/primary", type: "color", values: { value: "#111111" } },
          { name: "spacing/4", type: "spacing", values: { value: 16 } },
          { name: "typography/body", type: "typography", values: { value: "16px" } },
          { name: "radius/md", type: "radius", values: { value: 8 } },
        ],
        components: [],
        styles: [],
        lastSync: "2026-03-27T10:00:00.000Z",
      },
      async load() {},
      async getAllSpecs() {
        return [
          {
            type: "component",
            name: "Button",
            purpose: "Primary action button",
            shadcnBase: ["Button"],
          },
          {
            type: "page",
            name: "Dashboard",
            purpose: "Main dashboard",
          },
          {
            type: "component",
            name: "Card",
            purpose: "Card component",
            shadcnBase: [],
          },
        ];
      },
    },
    figma: {
      isConnected: false,
    },
  };
}

function captureLogs(): string[] {
  const logs: string[] = [];
  vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
    logs.push(args.join(" "));
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
  return logs;
}

function lastLog(logs: string[]): string {
  const value = logs.at(-1);
  if (!value) throw new Error("Expected a console.log call");
  return value;
}

function getChecks(payload: { checks?: unknown; results?: unknown }): Array<{ label: string; status: string; detail: string }> {
  const checks = payload.checks ?? payload.results;
  if (!Array.isArray(checks)) {
    throw new Error("Expected a checks/results array in doctor JSON payload");
  }
  return checks as Array<{ label: string; status: string; detail: string }>;
}

function getSummary(payload: { summary?: Record<string, number>; counts?: Record<string, number>; totals?: Record<string, number> }, checks?: Array<unknown>) {
  const summary = payload.summary ?? payload.counts ?? payload.totals;
  if (summary && typeof summary === "object") {
    return {
      pass: summary.pass ?? summary.passed ?? 0,
      warn: summary.warn ?? summary.warnings ?? 0,
      fail: summary.fail ?? summary.failed ?? 0,
      total: summary.total ?? (checks?.length ?? 0),
    };
  }

  return {
    pass: 0,
    warn: 0,
    fail: 0,
    total: checks?.length ?? 0,
  };
}

function statusMap(checks: Array<{ label: string; status: string }>): Record<string, string> {
  return Object.fromEntries(checks.map((check) => [check.label, check.status]));
}

function detailMap(checks: Array<{ label: string; detail: string }>): Map<string, string> {
  return new Map(checks.map((check) => [check.label, check.detail]));
}
