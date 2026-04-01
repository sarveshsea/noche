import { afterEach, describe, expect, it, vi } from "vitest";
import { Command } from "commander";
import { registerGenerateCommand } from "../generate.js";
import { captureLogs, lastLog } from "./test-helpers.js";

afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = 0;
});

describe("generate --json", () => {
  it("emits a structured success payload for a single spec", async () => {
    const logs = captureLogs();
    const engine = makeGenerateEngine({
      generateFromSpec: vi.fn(async (name: string) => `generated/pages/${name}.tsx`),
    });
    const program = new Command();

    registerGenerateCommand(program, engine as never);
    await program.parseAsync(["generate", "LoginPage", "--json"], { from: "user" });

    const payload = JSON.parse(lastLog(logs));
    expect(payload).toMatchObject({
      mode: "single",
      status: "completed",
      target: "LoginPage",
      options: {
        all: false,
        json: true,
      },
      summary: {
        totalSpecs: 1,
        attempted: 1,
        generated: 1,
        failed: 0,
      },
      generatedFiles: ["generated/pages/LoginPage.tsx"],
    });
    expect(payload.results).toEqual([
      {
        name: "LoginPage",
        status: "generated",
        entryFile: "generated/pages/LoginPage.tsx",
        error: null,
      },
    ]);
  });

  it("emits a partial payload when generating all specs with mixed results", async () => {
    const logs = captureLogs();
    const engine = makeGenerateEngine({
      specs: [{ name: "Button" }, { name: "Dashboard" }, { name: "BrokenSpec" }],
      generateFromSpec: vi.fn(async (name: string) => {
        if (name === "BrokenSpec") {
          throw new Error("missing purpose");
        }
        return `generated/${name}.tsx`;
      }),
    });
    const program = new Command();

    registerGenerateCommand(program, engine as never);
    await program.parseAsync(["generate", "--all", "--json"], { from: "user" });

    const payload = JSON.parse(lastLog(logs));
    expect(payload).toMatchObject({
      mode: "all",
      status: "partial",
      target: null,
      options: {
        all: true,
        json: true,
      },
      summary: {
        totalSpecs: 3,
        attempted: 3,
        generated: 2,
        failed: 1,
      },
      generatedFiles: ["generated/Button.tsx", "generated/Dashboard.tsx"],
    });
    expect(payload.results).toEqual([
      {
        name: "Button",
        status: "generated",
        entryFile: "generated/Button.tsx",
        error: null,
      },
      {
        name: "Dashboard",
        status: "generated",
        entryFile: "generated/Dashboard.tsx",
        error: null,
      },
      {
        name: "BrokenSpec",
        status: "failed",
        entryFile: null,
        error: "missing purpose",
      },
    ]);
  });

  it("returns a failure payload and exit code for JSON generation errors", async () => {
    const logs = captureLogs();
    const engine = makeGenerateEngine({
      generateFromSpec: vi.fn(async () => {
        throw new Error("spec not found");
      }),
    });
    const program = new Command();

    registerGenerateCommand(program, engine as never);
    await program.parseAsync(["generate", "MissingSpec", "--json"], { from: "user" });

    const payload = JSON.parse(lastLog(logs));
    expect(payload).toMatchObject({
      mode: "single",
      status: "failed",
      target: "MissingSpec",
      summary: {
        totalSpecs: 1,
        attempted: 1,
        generated: 0,
        failed: 1,
      },
      error: {
        message: "spec not found",
      },
    });
    expect(payload.results).toEqual([
      {
        name: "MissingSpec",
        status: "failed",
        entryFile: null,
        error: "spec not found",
      },
    ]);
    expect(process.exitCode).toBe(1);
  });
});

function makeGenerateEngine(input?: {
  specs?: Array<{ name: string }>;
  generateFromSpec?: (name: string) => Promise<string>;
}) {
  return {
    async init() {},
    registry: {
      async getAllSpecs() {
        return input?.specs ?? [{ name: "LoginPage" }];
      },
    },
    async generateFromSpec(name: string) {
      if (input?.generateFromSpec) {
        return input.generateFromSpec(name);
      }
      return `generated/${name}.tsx`;
    },
  };
}
