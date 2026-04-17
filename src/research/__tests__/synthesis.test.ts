import { describe, expect, it } from "vitest";
import { generateResearchReportMarkdown, synthesizeResearch } from "../synthesis.js";
import type { ResearchInsight, ResearchStore } from "../engine.js";

function makeInsight(overrides: Partial<ResearchInsight> = {}): ResearchInsight {
  return {
    id: `insight-${Math.random().toString(36).slice(2, 8)}`,
    finding: "Pain point: Navigation is confusing for new admins",
    confidence: "high",
    source: "interview-1",
    evidence: ["Users said they got lost in navigation"],
    tags: ["interview", "pain-point", "navigation"],
    createdAt: new Date().toISOString(),
    category: "pain-point",
    sentiment: "negative",
    signalTags: ["navigation"],
    ...overrides,
  };
}

function makeStore(): ResearchStore {
  return {
    insights: [
      makeInsight({
        id: "i-1",
        finding: "Pain point: Navigation is confusing for new admins",
        source: "interview-1",
        actor: "Admin Olivia",
      }),
      makeInsight({
        id: "i-2",
        finding: "User goal: Admins want faster setup for navigation defaults",
        source: "survey.csv",
        category: "goal",
        sentiment: "neutral",
        signalTags: ["navigation", "setup"],
        actor: "Admin Olivia",
      }),
      makeInsight({
        id: "i-3",
        finding: "Feature request: Designers want reusable dashboard sections",
        source: "figjam-stickies",
        category: "feature-request",
        sentiment: "positive",
        signalTags: ["dashboard", "section"],
        actor: "Designer Maya",
      }),
      makeInsight({
        id: "i-4",
        finding: "User opinion: The dashboard feels polished and easy to scan",
        source: "interview-2",
        category: "opinion",
        sentiment: "positive",
        signalTags: ["dashboard", "navigation"],
        actor: "Designer Maya",
      }),
      makeInsight({
        id: "i-5",
        finding: "Pain point: Dashboard performance feels slow on first load",
        source: "web:https://example.com/report",
        category: "technical-constraint",
        sentiment: "negative",
        signalTags: ["dashboard", "performance"],
        actor: "Engineer Kai",
      }),
    ],
    personas: [],
    themes: [],
    sources: [
      { name: "interview-1", type: "transcript", processedAt: "2026-04-17T00:00:00.000Z" },
      { name: "survey.csv", type: "csv", processedAt: "2026-04-17T00:00:00.000Z" },
      { name: "figjam-stickies", type: "figjam-stickies", processedAt: "2026-04-17T00:00:00.000Z" },
      { name: "https://example.com/report", type: "web", processedAt: "2026-04-17T00:00:00.000Z" },
    ],
    opportunities: [],
    risks: [],
    contradictions: [],
  };
}

describe("research synthesis", () => {
  it("builds themes, opportunities, risks, contradictions, and personas", () => {
    const store = makeStore();
    const result = synthesizeResearch(store);

    expect(result.themes.length).toBeGreaterThan(0);
    expect(result.themes[0]?.name).toBeTruthy();
    expect(result.opportunities.length).toBeGreaterThan(0);
    expect(result.risks.length).toBeGreaterThan(0);
    expect(result.contradictions.some((item) => item.topic === "Dashboard" || item.topic === "Navigation")).toBe(true);
    expect(result.personas.some((persona) => persona.name === "Admin Olivia")).toBe(true);
    expect(result.summary.nextActions.length).toBeGreaterThan(0);
  });

  it("generates a decision-ready markdown report", () => {
    const report = generateResearchReportMarkdown(makeStore());

    expect(report).toContain("## Executive Summary");
    expect(report).toContain("## Opportunities");
    expect(report).toContain("## Risks");
    expect(report).toContain("## Contradictions");
    expect(report).toContain("## Recommended Next Moves");
  });
});
