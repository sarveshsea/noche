/**
 * Research Synthesizer — Combines insights from multiple sources
 * into a coherent research narrative with personas and journey maps.
 */

import type { ResearchInsight, ResearchPersona, ResearchTheme, ResearchStore } from "./engine.js";
import { getAI } from "../ai/index.js";
import { createLogger } from "../engine/logger.js";

const log = createLogger("synthesizer");

export interface SynthesisResult {
  themes: ResearchTheme[];
  personas: ResearchPersona[];
  keyFindings: ResearchInsight[];
  gaps: string[];
  recommendations: string[];
  aiPowered?: boolean;
}

/**
 * Synthesize all research data into a coherent output.
 * Uses AI when available for deeper semantic analysis.
 */
export async function synthesizeResearch(store: ResearchStore): Promise<SynthesisResult> {
  const ai = getAI();
  if (ai && store.insights.length > 0) {
    try {
      return await aiSynthesize(store);
    } catch (err) {
      log.warn({ err }, "AI synthesis failed, falling back to heuristic");
    }
  }
  return heuristicSynthesize(store);
}

async function aiSynthesize(store: ResearchStore): Promise<SynthesisResult> {
  const ai = getAI()!;
  const insightSummaries = store.insights.slice(0, 50).map(i => ({
    id: i.id,
    finding: i.finding,
    confidence: i.confidence,
    tags: i.tags,
    evidenceCount: i.evidence.length,
  }));

  const result = await ai.completeJSON<{
    themes: Array<{ name: string; description: string; insightIds: string[]; frequency: number }>;
    personas: Array<{ name: string; role: string; goals: string[]; painPoints: string[]; behaviors: string[] }>;
    gaps: string[];
    recommendations: string[];
  }>({
    system: [
      "You are a UX research synthesis engine.",
      "Analyze the research insights and produce a structured synthesis.",
      `There are ${store.insights.length} insights from ${store.sources.length} sources.`,
      "Return JSON with: themes, personas, gaps, recommendations.",
    ].join("\n"),
    messages: [{
      role: "user",
      content: `Synthesize these research insights:\n${JSON.stringify(insightSummaries, null, 2)}`,
    }],
    model: "fast",
  });

  return {
    themes: result.themes.map(t => ({
      name: t.name,
      description: t.description,
      insights: t.insightIds,
      frequency: t.frequency,
    })),
    personas: result.personas.map(p => ({
      ...p,
      source: "AI-synthesized from research data",
    })),
    keyFindings: rankInsights(store.insights),
    gaps: result.gaps,
    recommendations: result.recommendations,
    aiPowered: true,
  };
}

function heuristicSynthesize(store: ResearchStore): SynthesisResult {
  const themes = identifyThemes(store.insights);
  const personas = inferPersonas(store.insights);
  const keyFindings = rankInsights(store.insights);
  const gaps = identifyGaps(store);
  const recommendations = generateRecommendations(themes, keyFindings);

  return {
    themes,
    personas,
    keyFindings,
    gaps,
    recommendations,
  };
}

function identifyThemes(insights: ResearchInsight[]): ResearchTheme[] {
  // Group by tags and find recurring patterns
  const tagCounts = new Map<string, ResearchInsight[]>();

  for (const insight of insights) {
    for (const tag of insight.tags) {
      const group = tagCounts.get(tag) ?? [];
      group.push(insight);
      tagCounts.set(tag, group);
    }
  }

  return Array.from(tagCounts.entries())
    .filter(([_, group]) => group.length >= 2)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([tag, group]) => ({
      name: tag,
      description: `${group.length} findings related to "${tag}"`,
      insights: group.map((i) => i.id),
      frequency: group.length,
    }));
}

function inferPersonas(insights: ResearchInsight[]): ResearchPersona[] {
  // Look for user-type patterns in research data
  const userMentions = insights.filter((i) =>
    i.tags.includes("qualitative") || i.tags.includes("survey")
  );

  if (userMentions.length < 3) return [];

  // Create a generic primary persona from the research
  const painPoints = userMentions
    .filter((i) => i.finding.toLowerCase().includes("pain") ||
      i.finding.toLowerCase().includes("frustrat") ||
      i.finding.toLowerCase().includes("difficult"))
    .map((i) => i.finding)
    .slice(0, 5);

  const goals = userMentions
    .filter((i) => i.finding.toLowerCase().includes("want") ||
      i.finding.toLowerCase().includes("need") ||
      i.finding.toLowerCase().includes("goal"))
    .map((i) => i.finding)
    .slice(0, 5);

  if (painPoints.length === 0 && goals.length === 0) return [];

  return [{
    name: "Primary User",
    role: "Derived from research data",
    goals: goals.length > 0 ? goals : ["Complete core tasks efficiently"],
    painPoints: painPoints.length > 0 ? painPoints : ["No specific pain points identified"],
    behaviors: ["Behavior patterns require more targeted research"],
    source: `Synthesized from ${userMentions.length} qualitative findings`,
  }];
}

function rankInsights(insights: ResearchInsight[]): ResearchInsight[] {
  return [...insights].sort((a, b) => {
    const confidenceOrder = { high: 3, medium: 2, low: 1 };
    const aScore = confidenceOrder[a.confidence] + a.evidence.length * 0.5;
    const bScore = confidenceOrder[b.confidence] + b.evidence.length * 0.5;
    return bScore - aScore;
  });
}

function identifyGaps(store: ResearchStore): string[] {
  const gaps: string[] = [];

  if (store.insights.filter((i) => i.tags.includes("quantitative")).length === 0) {
    gaps.push("No quantitative data — consider adding survey scores or analytics");
  }

  if (store.insights.filter((i) => i.tags.includes("qualitative")).length === 0) {
    gaps.push("No qualitative data — consider interviews or open-ended survey responses");
  }

  if (store.sources.length < 2) {
    gaps.push("Single data source — triangulate with additional sources for stronger findings");
  }

  const highConf = store.insights.filter((i) => i.confidence === "high");
  if (highConf.length === 0) {
    gaps.push("No high-confidence findings — more data or stronger evidence needed");
  }

  return gaps;
}

function generateRecommendations(
  themes: ResearchTheme[],
  keyFindings: ResearchInsight[]
): string[] {
  const recs: string[] = [];

  if (themes.length > 0) {
    recs.push(`Focus on top theme: "${themes[0].name}" (${themes[0].frequency} supporting findings)`);
  }

  const highFindings = keyFindings.filter((f) => f.confidence === "high");
  if (highFindings.length > 0) {
    recs.push(`${highFindings.length} high-confidence findings should drive design decisions`);
  }

  if (themes.length > 3) {
    recs.push("Multiple themes identified — consider prioritizing by user impact");
  }

  return recs;
}
