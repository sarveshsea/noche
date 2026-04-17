import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Command } from "commander";
import { registerResearchCommand } from "../research.js";
import { captureLogs, lastLog } from "./test-helpers.js";

// Mock existsSync so the from-file command doesn't bail on missing fixtures
vi.mock("fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs")>();
  return { ...actual, existsSync: vi.fn(() => true) };
});

afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = 0;
});

describe("research --json", () => {
  it("emits a single structured payload for from-file --json", async () => {
    const logs = captureLogs();
    const program = new Command();

    registerResearchCommand(program, makeResearchEngine() as never);
    await program.parseAsync(["research", "from-file", "fixtures/interviews.csv", "--json"], { from: "user" });

    expect(logs).toHaveLength(1);
    const payload = JSON.parse(lastLog(logs));
    expect(payload).toMatchObject({
      action: "from-file",
      status: "completed",
      options: { json: true },
      source: {
        type: "file",
        path: "fixtures/interviews.csv",
      },
      summary: {
        insights: 3,
        themes: 2,
        personas: 1,
        sources: 2,
      },
      artifacts: {
        researchDir: "/workspace/research",
        insightsPath: "/workspace/research/insights.json",
        notesDir: "/workspace/research/notes",
        reportPath: "/workspace/research/reports/report.md",
      },
    });
  });

  it("emits sticky metadata without preamble logs for from-stickies --json", async () => {
    const logs = captureLogs();
    const program = new Command();

    registerResearchCommand(program, makeResearchEngine({ figmaConnected: false }) as never);
    await program.parseAsync(["research", "from-stickies", "--json"], { from: "user" });

    expect(logs).toHaveLength(1);
    const payload = JSON.parse(lastLog(logs));
    expect(payload).toMatchObject({
      action: "from-stickies",
      status: "completed",
      stickies: {
        total: 5,
        clusters: 2,
        unclustered: 1,
        summary: "Processed 5 sticky notes",
        autoConnected: true,
      },
    });
  });

  it("emits synthesis and report metadata for JSON modes", async () => {
    const synthLogs = captureLogs();
    const synthProgram = new Command();
    registerResearchCommand(synthProgram, makeResearchEngine() as never);

    await synthProgram.parseAsync(["research", "synthesize", "--json"], { from: "user" });

    expect(synthLogs).toHaveLength(1);
    const synthPayload = JSON.parse(lastLog(synthLogs));
    expect(synthPayload).toMatchObject({
      action: "synthesize",
      status: "completed",
      synthesis: {
        summary: "Synthesized 2 themes",
        themes: 2,
        topTheme: "Navigation",
        personas: 1,
        opportunities: 2,
        topOpportunity: "Invest in Navigation",
        risks: 1,
        topRisk: "Navigation is a product risk",
        contradictions: 1,
      },
    });

    vi.restoreAllMocks();

    const reportLogs = captureLogs();
    const reportProgram = new Command();
    registerResearchCommand(reportProgram, makeResearchEngine() as never);

    await reportProgram.parseAsync(["research", "report", "--json"], { from: "user" });

    expect(reportLogs).toHaveLength(1);
    const reportPayload = JSON.parse(lastLog(reportLogs));
    expect(reportPayload).toMatchObject({
      action: "report",
      status: "completed",
      report: {
        path: "/workspace/research/reports/report.md",
        bytes: Buffer.byteLength("# Report\nOne insight\n", "utf-8"),
        lines: 3,
      },
    });
  });
});

function makeResearchEngine(input?: { figmaConnected?: boolean }) {
  return {
    config: { projectRoot: "/workspace" },
    async init() {},
    async connectFigma() {},
    figma: {
      isConnected: input?.figmaConnected ?? true,
      async extractStickies() {
        return [{ text: "A" }, { text: "B" }, { text: "C" }, { text: "D" }, { text: "E" }];
      },
    },
    research: {
      async load() {},
      async fromFile() {},
      async fromStickies() {
        return {
          totalStickies: 5,
          clusters: [{}, {}],
          unclustered: [{}],
          summary: "Processed 5 sticky notes",
        };
      },
      async synthesize() {
        return {
          summary: "Synthesized 2 themes",
          themes: [{ name: "Navigation" }, { name: "Trust" }],
        };
      },
      async generateReport() {
        return "# Report\nOne insight\n";
      },
      getStore() {
        return {
          insights: [{}, {}, {}],
          themes: [{ name: "Navigation" }, { name: "Trust" }],
          personas: [{ name: "PM" }],
          sources: [{ name: "CSV" }, { name: "FigJam" }],
          opportunities: [{ title: "Invest in Navigation" }, { title: "Invest in Trust" }],
          risks: [{ title: "Navigation is a product risk" }],
          contradictions: [{ topic: "Navigation" }],
        };
      },
    },
  };
}
