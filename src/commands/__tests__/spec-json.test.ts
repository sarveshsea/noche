import { afterEach, describe, expect, it, vi } from "vitest";
import { Command } from "commander";
import { registerSpecCommand } from "../spec.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("spec list --json", () => {
  it("emits structured spec inventory with generation state", async () => {
    const logs = captureLogs();
    const program = new Command();

    registerSpecCommand(program, makeSpecEngine() as never);
    await program.parseAsync(["spec", "list", "--json"], { from: "user" });

    const payload = JSON.parse(lastLog(logs));
    expect(payload.options.json).toBe(true);
    expect(payload.summary).toMatchObject({
      total: 4,
      generated: 2,
      pending: 2,
      byType: {
        component: 1,
        page: 1,
        dataviz: 1,
        design: 0,
        ia: 1,
        other: 0,
      },
    });
    expect(payload.specs).toEqual([
      {
        name: "Button",
        type: "component",
        status: "generated",
        generatedAt: "2026-03-27T12:00:00.000Z",
        files: ["generated/components/ui/Button.tsx"],
      },
      {
        name: "Dashboard",
        type: "page",
        status: "pending",
        generatedAt: null,
        files: [],
      },
      {
        name: "ActivityChart",
        type: "dataviz",
        status: "generated",
        generatedAt: "2026-03-27T12:05:00.000Z",
        files: ["generated/dataviz/ActivityChart.tsx"],
      },
      {
        name: "SiteMap",
        type: "ia",
        status: "pending",
        generatedAt: null,
        files: [],
      },
    ]);
  });

  it("emits an empty payload when no specs exist", async () => {
    const logs = captureLogs();
    const program = new Command();

    registerSpecCommand(program, makeSpecEngine([]) as never);
    await program.parseAsync(["spec", "list", "--json"], { from: "user" });

    const payload = JSON.parse(lastLog(logs));
    expect(payload.summary.total).toBe(0);
    expect(payload.summary.generated).toBe(0);
    expect(payload.summary.pending).toBe(0);
    expect(payload.specs).toEqual([]);
  });
});

function makeSpecEngine(specs = [
  { type: "component", name: "Button" },
  { type: "page", name: "Dashboard" },
  { type: "dataviz", name: "ActivityChart" },
  { type: "ia", name: "SiteMap" },
]) {
  return {
    async init() {},
    registry: {
      async getAllSpecs() {
        return specs;
      },
      getGenerationState(name: string) {
        if (name === "Button") {
          return {
            generatedAt: "2026-03-27T12:00:00.000Z",
            files: ["generated/components/ui/Button.tsx"],
          };
        }
        if (name === "ActivityChart") {
          return {
            generatedAt: "2026-03-27T12:05:00.000Z",
            files: ["generated/dataviz/ActivityChart.tsx"],
          };
        }
        return null;
      },
      async saveSpec() {},
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
