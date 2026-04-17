import {
  detectResearchSentiment,
  extractResearchEntities,
  extractResearchSignals,
  formatResearchSignal,
  inferResearchCategory,
  stripFindingPrefix,
  type ResearchSentiment,
} from "./analysis.js";
import type {
  ResearchContradiction,
  ResearchInsight,
  ResearchOpportunity,
  ResearchPersona,
  ResearchRisk,
  ResearchSourceRecord,
  ResearchStore,
  ResearchSummarySnapshot,
  ResearchTheme,
} from "./engine.js";

type EnrichedInsight = ResearchInsight & {
  category: string;
  sentiment: ResearchSentiment;
  entities: string[];
  signalTags: string[];
};

const RISK_CATEGORIES = new Set(["pain-point", "technical-constraint", "regulatory", "workaround"]);
const OPPORTUNITY_CATEGORIES = new Set(["goal", "need", "feature-request", "best-practice", "user-need"]);
const IGNORED_ACTORS = new Set(["interviewer", "moderator", "unknown"]);

export function synthesizeResearch(store: ResearchStore): {
  themes: ResearchTheme[];
  personas: ResearchPersona[];
  opportunities: ResearchOpportunity[];
  risks: ResearchRisk[];
  contradictions: ResearchContradiction[];
  summary: ResearchSummarySnapshot;
} {
  const enriched = store.insights.map(enrichInsight);
  const themes = buildThemes(enriched);
  const opportunities = buildOpportunities(themes, enriched);
  const risks = buildRisks(themes, enriched);
  const contradictions = buildContradictions(themes, enriched);
  const personas = buildPersonas(enriched, store.personas ?? [], themes);
  const uniqueSources = new Set(enriched.map((insight) => insight.source));

  const summary: ResearchSummarySnapshot = {
    narrative: buildNarrative(enriched, themes, opportunities, risks, contradictions, uniqueSources.size),
    topThemes: themes.slice(0, 3).map((theme) => theme.name),
    topOpportunities: opportunities.slice(0, 3).map((opportunity) => opportunity.title),
    topRisks: risks.slice(0, 3).map((risk) => risk.title),
    contradictionCount: contradictions.length,
    nextActions: buildNextActions(opportunities, risks, contradictions),
    generatedAt: new Date().toISOString(),
    coverage: {
      sources: uniqueSources.size,
      insights: enriched.length,
      highConfidence: enriched.filter((insight) => insight.confidence === "high").length,
      personas: personas.length,
      themes: themes.length,
    },
  };

  return { themes, personas, opportunities, risks, contradictions, summary };
}

export function generateResearchReportMarkdown(store: ResearchStore): string {
  const synthesis = synthesizeResearch(store);
  const mergedSources = mergeSourceRecords(store.sources ?? []);
  const highConfidence = store.insights.filter((insight) => insight.confidence === "high");
  const lines: string[] = [
    "# Research Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Executive Summary",
    "",
    synthesis.summary.narrative,
    "",
    "## Coverage",
    "",
    `- Sources: ${synthesis.summary.coverage.sources}`,
    `- Insights: ${synthesis.summary.coverage.insights}`,
    `- High-confidence insights: ${synthesis.summary.coverage.highConfidence}`,
    `- Themes: ${synthesis.summary.coverage.themes}`,
    `- Personas: ${synthesis.summary.coverage.personas}`,
    `- Contradictions to watch: ${synthesis.summary.contradictionCount}`,
    "",
  ];

  if (synthesis.themes.length > 0) {
    lines.push("## Top Themes", "");
    for (const theme of synthesis.themes.slice(0, 8)) {
      lines.push(`### ${theme.name}`);
      lines.push(theme.description);
      lines.push(`- Frequency: ${theme.frequency}`);
      if (theme.sourceCount) lines.push(`- Sources: ${theme.sourceCount}`);
      if (theme.confidence) lines.push(`- Confidence: ${theme.confidence}`);
      lines.push("");
    }
  }

  if (synthesis.opportunities.length > 0) {
    lines.push("## Opportunities", "");
    for (const opportunity of synthesis.opportunities) {
      lines.push(`### ${opportunity.title}`);
      lines.push(opportunity.summary);
      lines.push(`- Priority: ${opportunity.priority}`);
      lines.push(`- Confidence: ${opportunity.confidence}`);
      lines.push(`- Sources: ${opportunity.sourceCount}`);
      lines.push("");
    }
  }

  if (synthesis.risks.length > 0) {
    lines.push("## Risks", "");
    for (const risk of synthesis.risks) {
      lines.push(`### ${risk.title}`);
      lines.push(risk.summary);
      lines.push(`- Severity: ${risk.severity}`);
      lines.push(`- Sources: ${risk.sourceCount}`);
      lines.push("");
    }
  }

  if (synthesis.contradictions.length > 0) {
    lines.push("## Contradictions", "");
    for (const contradiction of synthesis.contradictions) {
      lines.push(`### ${contradiction.topic}`);
      lines.push(contradiction.summary);
      lines.push(`- Positive signals: ${contradiction.positiveInsightIds.length}`);
      lines.push(`- Negative signals: ${contradiction.negativeInsightIds.length}`);
      lines.push("");
    }
  }

  if (synthesis.personas.length > 0) {
    lines.push("## Personas", "");
    for (const persona of synthesis.personas) {
      lines.push(`### ${persona.name}`);
      lines.push(`- Role: ${persona.role}`);
      if (persona.goals.length > 0) {
        lines.push(`- Goals: ${persona.goals.join("; ")}`);
      }
      if (persona.painPoints.length > 0) {
        lines.push(`- Pain points: ${persona.painPoints.join("; ")}`);
      }
      if (persona.behaviors.length > 0) {
        lines.push(`- Behaviors: ${persona.behaviors.join("; ")}`);
      }
      if (persona.quote) {
        lines.push(`- Representative quote: "${persona.quote}"`);
      }
      lines.push("");
    }
  }

  lines.push("## Recommended Next Moves", "");
  for (const action of synthesis.summary.nextActions) {
    lines.push(`- ${action}`);
  }
  lines.push("");

  if (highConfidence.length > 0) {
    lines.push("## Evidence Index", "");
    for (const insight of highConfidence.slice(0, 12)) {
      lines.push(`- **${insight.finding}** (${insight.source})`);
      if (insight.evidence.length > 0) {
        lines.push(`  - ${insight.evidence[0]}`);
      }
    }
    lines.push("");
  }

  lines.push("## Sources", "");
  for (const source of mergedSources) {
    lines.push(`- ${source.name} (${source.type}, processed ${source.processedAt})`);
    if (source.itemCount || source.insightCount || source.highConfidenceCount) {
      lines.push(
        `  - Items: ${source.itemCount ?? 0}, insights: ${source.insightCount ?? 0}, high-confidence: ${source.highConfidenceCount ?? 0}`,
      );
    }
    if (source.domain) lines.push(`  - Domain: ${source.domain}`);
    if (source.notes && source.notes.length > 0) lines.push(`  - Notes: ${source.notes.join("; ")}`);
  }

  return lines.join("\n");
}

function enrichInsight(insight: ResearchInsight): EnrichedInsight {
  const entities = insight.entities ?? extractResearchEntities(insight.finding);
  const category = insight.category ?? inferResearchCategory(insight.finding, insight.tags);
  const sentiment = insight.sentiment ?? detectResearchSentiment(insight.finding);
  const signalTags = insight.signalTags ?? extractResearchSignals(insight.finding, insight.tags, entities);
  return {
    ...insight,
    entities,
    category,
    sentiment,
    signalTags,
  };
}

function buildThemes(insights: EnrichedInsight[]): ResearchTheme[] {
  const groups = new Map<string, {
    insights: EnrichedInsight[];
    sourceNames: Set<string>;
    categories: Map<string, number>;
    positive: number;
    negative: number;
    confidenceScore: number;
  }>();

  for (const insight of insights) {
    const signals = insight.signalTags.slice(0, 2);
    for (const signal of signals) {
      const group = groups.get(signal) ?? {
        insights: [],
        sourceNames: new Set<string>(),
        categories: new Map<string, number>(),
        positive: 0,
        negative: 0,
        confidenceScore: 0,
      };

      group.insights.push(insight);
      group.sourceNames.add(insight.source);
      group.categories.set(insight.category, (group.categories.get(insight.category) ?? 0) + 1);
      if (insight.sentiment === "positive") group.positive++;
      if (insight.sentiment === "negative" || insight.sentiment === "mixed") group.negative++;
      group.confidenceScore += confidenceWeight(insight.confidence);
      groups.set(signal, group);
    }
  }

  return Array.from(groups.entries())
    .filter(([, group]) => group.insights.length >= 2 || group.sourceNames.size >= 2)
    .map(([signal, group]) => {
      const topCategories = Array.from(group.categories.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([category]) => category);
      const confidence = deriveGroupConfidence(group.confidenceScore, group.sourceNames.size, group.insights.length);
      return {
        name: formatResearchSignal(signal),
        description: `Observed in ${group.insights.length} insights across ${group.sourceNames.size} sources. Strongest signals: ${topCategories.join(", ") || "general"}.`,
        insights: unique(group.insights.map((insight) => insight.id)),
        frequency: group.insights.length,
        sourceCount: group.sourceNames.size,
        confidence,
        signalTags: [signal],
        positiveCount: group.positive,
        negativeCount: group.negative,
      } satisfies ResearchTheme;
    })
    .sort((a, b) =>
      (b.sourceCount ?? 0) - (a.sourceCount ?? 0)
      || b.frequency - a.frequency
      || confidenceWeight(b.confidence ?? "low") - confidenceWeight(a.confidence ?? "low"))
    .slice(0, 12);
}

function buildOpportunities(themes: ResearchTheme[], insights: EnrichedInsight[]): ResearchOpportunity[] {
  return themes
    .map((theme) => {
      const related = insights.filter((insight) => theme.insights.includes(insight.id));
      const opportunitySignals = related.filter((insight) =>
        OPPORTUNITY_CATEGORIES.has(insight.category) || insight.sentiment === "positive");
      const score = opportunitySignals.length * 2 + (theme.sourceCount ?? 0);
      return {
        title: `Invest in ${theme.name}`,
        summary: `Turn the ${theme.name.toLowerCase()} signal into a sharper product bet. ${opportunitySignals.length} opportunity-oriented insights surfaced across ${theme.sourceCount ?? 0} sources.`,
        theme: theme.name,
        confidence: theme.confidence ?? "low",
        priority: score >= 6 ? "high" : score >= 4 ? "medium" : "low",
        evidenceInsightIds: opportunitySignals.slice(0, 5).map((insight) => insight.id),
        sourceCount: theme.sourceCount ?? 0,
      } satisfies ResearchOpportunity;
    })
    .filter((opportunity) => opportunity.evidenceInsightIds.length > 0)
    .slice(0, 6);
}

function buildRisks(themes: ResearchTheme[], insights: EnrichedInsight[]): ResearchRisk[] {
  return themes
    .map((theme) => {
      const related = insights.filter((insight) => theme.insights.includes(insight.id));
      const riskSignals = related.filter((insight) =>
        RISK_CATEGORIES.has(insight.category) || insight.sentiment === "negative" || insight.sentiment === "mixed");
      const severityScore = riskSignals.length * 2 + (theme.sourceCount ?? 0);
      return {
        title: `${theme.name} is a product risk`,
        summary: `${riskSignals.length} negative or risk-oriented signals point at ${theme.name.toLowerCase()}. This is where adoption or trust is likely to leak first.`,
        theme: theme.name,
        severity: severityScore >= 6 ? "high" : severityScore >= 4 ? "medium" : "low",
        evidenceInsightIds: riskSignals.slice(0, 5).map((insight) => insight.id),
        sourceCount: theme.sourceCount ?? 0,
      } satisfies ResearchRisk;
    })
    .filter((risk) => risk.evidenceInsightIds.length > 0)
    .slice(0, 6);
}

function buildContradictions(themes: ResearchTheme[], insights: EnrichedInsight[]): ResearchContradiction[] {
  return themes
    .map((theme) => {
      const related = insights.filter((insight) => theme.insights.includes(insight.id));
      const positive = related.filter((insight) => insight.sentiment === "positive").map((insight) => insight.id);
      const negative = related.filter((insight) => insight.sentiment === "negative" || insight.sentiment === "mixed").map((insight) => insight.id);
      return {
        topic: theme.name,
        positiveInsightIds: positive,
        negativeInsightIds: negative,
        summary: `Evidence is split on ${theme.name.toLowerCase()}: ${positive.length} positive signal${positive.length === 1 ? "" : "s"} versus ${negative.length} negative signal${negative.length === 1 ? "" : "s"}.`,
      } satisfies ResearchContradiction;
    })
    .filter((contradiction) => contradiction.positiveInsightIds.length > 0 && contradiction.negativeInsightIds.length > 0)
    .slice(0, 5);
}

function buildPersonas(
  insights: EnrichedInsight[],
  existing: ResearchPersona[],
  themes: ResearchTheme[],
): ResearchPersona[] {
  const personas = [...existing];
  const actorGroups = new Map<string, EnrichedInsight[]>();

  for (const insight of insights) {
    const actor = insight.actor?.trim();
    if (!actor || IGNORED_ACTORS.has(actor.toLowerCase())) continue;
    const group = actorGroups.get(actor) ?? [];
    group.push(insight);
    actorGroups.set(actor, group);
  }

  for (const [actor, actorInsights] of actorGroups) {
    if (actorInsights.length < 2) continue;
    if (personas.some((persona) => persona.name === actor)) continue;

    const goals = topFindings(actorInsights.filter((insight) => OPPORTUNITY_CATEGORIES.has(insight.category)), 3);
    const painPoints = topFindings(actorInsights.filter((insight) => RISK_CATEGORIES.has(insight.category) || insight.sentiment === "negative"), 3);
    const behaviors = topFindings(actorInsights.filter((insight) => insight.category === "behavior"), 2);

    personas.push({
      name: actor,
      role: inferRole(actor),
      goals: goals.length > 0 ? goals : topThemeNames(themes, actorInsights, 2),
      painPoints,
      behaviors: behaviors.length > 0 ? behaviors : topThemeNames(themes, actorInsights, 2),
      source: actorInsights[0]?.source ?? "research-synthesis",
      quote: actorInsights.flatMap((insight) => insight.evidence).find(Boolean),
      evidenceInsightIds: actorInsights.slice(0, 5).map((insight) => insight.id),
      confidence: actorInsights.length >= 4 ? "high" : "medium",
    });
  }

  if (personas.length === 0 && insights.length > 0) {
    const goals = topFindings(insights.filter((insight) => OPPORTUNITY_CATEGORIES.has(insight.category)), 3);
    const painPoints = topFindings(insights.filter((insight) => RISK_CATEGORIES.has(insight.category) || insight.sentiment === "negative"), 3);
    personas.push({
      name: "Primary User",
      role: "cross-source participant",
      goals,
      painPoints,
      behaviors: topThemeNames(themes, insights, 3),
      source: "research-synthesis",
      evidenceInsightIds: insights.slice(0, 5).map((insight) => insight.id),
      confidence: insights.length >= 6 ? "medium" : "low",
    });
  }

  return personas.slice(0, 6);
}

function buildNarrative(
  insights: EnrichedInsight[],
  themes: ResearchTheme[],
  opportunities: ResearchOpportunity[],
  risks: ResearchRisk[],
  contradictions: ResearchContradiction[],
  uniqueSources: number,
): string {
  const parts = [
    `Synthesized ${insights.length} insights into ${themes.length} themes across ${uniqueSources} sources.`,
  ];

  if (themes.length > 0) {
    parts.push(`Top theme: ${themes[0].name}.`);
  }
  if (opportunities.length > 0) {
    parts.push(`Best near-term opportunity: ${opportunities[0].title}.`);
  }
  if (risks.length > 0) {
    parts.push(`Largest product risk: ${risks[0].title}.`);
  }
  if (contradictions.length > 0) {
    parts.push(`${contradictions.length} contradiction${contradictions.length === 1 ? "" : "s"} need validation before shipping.`);
  }

  return parts.join(" ");
}

function buildNextActions(
  opportunities: ResearchOpportunity[],
  risks: ResearchRisk[],
  contradictions: ResearchContradiction[],
): string[] {
  const actions: string[] = [];

  if (risks[0]) {
    actions.push(`Fix the highest-severity risk around ${risks[0].theme.toLowerCase()} before adding more surface area.`);
  }
  if (opportunities[0]) {
    actions.push(`Turn ${opportunities[0].theme.toLowerCase()} into a specific product experiment with measurable adoption criteria.`);
  }
  if (contradictions[0]) {
    actions.push(`Run targeted follow-up research on ${contradictions[0].topic.toLowerCase()} to resolve conflicting evidence.`);
  }
  if (actions.length === 0) {
    actions.push("Collect more source data before making product bets from this research set.");
  }

  return actions.slice(0, 3);
}

function deriveGroupConfidence(confidenceScore: number, sourceCount: number, insightCount: number): "high" | "medium" | "low" {
  if (sourceCount >= 3 || confidenceScore >= 10 || insightCount >= 5) return "high";
  if (sourceCount >= 2 || confidenceScore >= 6 || insightCount >= 3) return "medium";
  return "low";
}

function inferRole(actor: string): string {
  const lowered = actor.toLowerCase();
  if (lowered.includes("pm") || lowered.includes("product")) return "product";
  if (lowered.includes("designer")) return "designer";
  if (lowered.includes("engineer") || lowered.includes("developer")) return "engineer";
  if (lowered.includes("admin")) return "admin";
  return "participant";
}

function topFindings(insights: EnrichedInsight[], limit: number): string[] {
  return unique(
    insights
      .map((insight) => stripFindingPrefix(insight.finding))
      .filter(Boolean),
  ).slice(0, limit);
}

function topThemeNames(themes: ResearchTheme[], insights: EnrichedInsight[], limit: number): string[] {
  const ids = new Set(insights.map((insight) => insight.id));
  return themes
    .filter((theme) => theme.insights.some((insightId) => ids.has(insightId)))
    .slice(0, limit)
    .map((theme) => theme.name);
}

function mergeSourceRecords(sources: ResearchSourceRecord[]): ResearchSourceRecord[] {
  const merged = new Map<string, ResearchSourceRecord>();
  for (const source of sources) {
    const key = `${source.type}:${source.name}`;
    const previous = merged.get(key);
    if (!previous) {
      merged.set(key, { ...source });
      continue;
    }
    previous.itemCount = (previous.itemCount ?? 0) + (source.itemCount ?? 0);
    previous.insightCount = (previous.insightCount ?? 0) + (source.insightCount ?? 0);
    previous.highConfidenceCount = (previous.highConfidenceCount ?? 0) + (source.highConfidenceCount ?? 0);
    previous.notes = unique([...(previous.notes ?? []), ...(source.notes ?? [])]);
    previous.domain ??= source.domain;
    previous.processedAt = source.processedAt > previous.processedAt ? source.processedAt : previous.processedAt;
  }
  return Array.from(merged.values()).sort((a, b) => b.processedAt.localeCompare(a.processedAt));
}

function confidenceWeight(confidence: "high" | "medium" | "low"): number {
  return confidence === "high" ? 3 : confidence === "medium" ? 2 : 1;
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}
