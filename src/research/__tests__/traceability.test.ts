import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { ResearchTraceability } from "../traceability.js";
import type { ResearchInsight } from "../engine.js";

let testDir: string;
let trace: ResearchTraceability;

beforeEach(async () => {
  testDir = join(tmpdir(), `memoire-trace-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await mkdir(join(testDir, "research"), { recursive: true });
  trace = new ResearchTraceability(testDir);
  await trace.load();
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});

function makeSpec(name: string, backing: string[] = []) {
  return { name, type: "component" as const, researchBacking: backing } as any;
}

describe("ResearchTraceability", () => {
  it("starts empty", () => {
    expect(trace.getSpecsForInsight("any")).toHaveLength(0);
    expect(trace.getInsightsForSpec("any")).toHaveLength(0);
  });

  it("indexes spec -> insight on save", async () => {
    await trace.onSpecSaved(makeSpec("Button", ["insight-1", "insight-2"]));
    expect(trace.getInsightsForSpec("Button")).toEqual(["insight-1", "insight-2"]);
    expect(trace.getSpecsForInsight("insight-1")).toEqual(["Button"]);
    expect(trace.getSpecsForInsight("insight-2")).toEqual(["Button"]);
  });

  it("updates index when spec is re-saved with different insights", async () => {
    await trace.onSpecSaved(makeSpec("Card", ["insight-1"]));
    expect(trace.getSpecsForInsight("insight-1")).toEqual(["Card"]);

    await trace.onSpecSaved(makeSpec("Card", ["insight-2"]));
    expect(trace.getSpecsForInsight("insight-1")).toHaveLength(0);
    expect(trace.getSpecsForInsight("insight-2")).toEqual(["Card"]);
  });

  it("handles multiple specs referencing same insight", async () => {
    await trace.onSpecSaved(makeSpec("Button", ["insight-1"]));
    await trace.onSpecSaved(makeSpec("Card", ["insight-1"]));
    expect(trace.getSpecsForInsight("insight-1")).toEqual(["Button", "Card"]);
  });

  it("removes spec from index", async () => {
    await trace.onSpecSaved(makeSpec("Button", ["insight-1"]));
    await trace.onSpecRemoved("Button");
    expect(trace.getSpecsForInsight("insight-1")).toHaveLength(0);
    expect(trace.getInsightsForSpec("Button")).toHaveLength(0);
  });

  it("persists and reloads from disk", async () => {
    await trace.onSpecSaved(makeSpec("Button", ["insight-1"]));

    const trace2 = new ResearchTraceability(testDir);
    await trace2.load();
    expect(trace2.getSpecsForInsight("insight-1")).toEqual(["Button"]);
  });

  it("computes coverage", async () => {
    await trace.onSpecSaved(makeSpec("Button", ["insight-1"]));
    await trace.onSpecSaved(makeSpec("Card", []));

    const cov = trace.getCoverage(["Button", "Card", "Input"]);
    expect(cov.covered).toBe(1);
    expect(cov.total).toBe(3);
    expect(cov.ratio).toBeCloseTo(1 / 3, 2);
  });

  it("finds orphaned insights", async () => {
    await trace.onSpecSaved(makeSpec("Button", ["insight-1"]));

    const insights: ResearchInsight[] = [
      { id: "insight-1", finding: "Linked", confidence: "high", source: "test", evidence: [], tags: [], createdAt: "" },
      { id: "insight-2", finding: "Orphaned", confidence: "high", source: "test", evidence: [], tags: [], createdAt: "" },
    ];

    const orphaned = trace.getOrphanedInsights(insights);
    expect(orphaned).toHaveLength(1);
    expect(orphaned[0].id).toBe("insight-2");
  });
});
