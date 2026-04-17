/**
 * Research Engine — Transforms raw qualitative and quantitative inputs
 * into structured research artifacts that are useful for decisions,
 * not just storage.
 *
 * The store is persisted as `research/insights.json` and is intentionally
 * backward-compatible with older, thinner research payloads.
 */

import { createHash } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import { clusterStickies, extractThemes, type ParsedResearch } from "../figma/stickies.js";
import type { StickyNote } from "../figma/bridge.js";
import type { MemoireEvent } from "../engine/core.js";
import { createLogger } from "../engine/logger.js";
import {
  detectResearchSentiment,
  extractResearchEntities,
  extractResearchSignals,
  inferResearchCategory,
} from "./analysis.js";
import { parseExcel } from "./excel-parser.js";
import { generateResearchReportMarkdown, synthesizeResearch } from "./synthesis.js";
import type { TranscriptAnalysis } from "./transcript-parser.js";
import type { WebResearchResult } from "./web-researcher.js";

export interface ResearchConfig {
  outputDir: string;
  onEvent?: (event: MemoireEvent) => void;
}

export type ResearchConfidence = "high" | "medium" | "low";
export type ResearchSentiment = "positive" | "negative" | "neutral" | "mixed";

export interface ResearchInsight {
  id: string;
  finding: string;
  confidence: ResearchConfidence;
  source: string;
  evidence: string[];
  tags: string[];
  createdAt: string;
  category?: string;
  sentiment?: ResearchSentiment;
  entities?: string[];
  signalTags?: string[];
  actor?: string;
  sourceType?: string;
  supportingSources?: string[];
}

export interface ResearchPersona {
  name: string;
  role: string;
  goals: string[];
  painPoints: string[];
  behaviors: string[];
  source: string;
  quote?: string;
  confidence?: ResearchConfidence;
  evidenceInsightIds?: string[];
}

export interface ResearchTheme {
  name: string;
  description: string;
  insights: string[];
  frequency: number;
  sourceCount?: number;
  confidence?: ResearchConfidence;
  signalTags?: string[];
  positiveCount?: number;
  negativeCount?: number;
}

export interface ResearchSourceRecord {
  name: string;
  type: string;
  processedAt: string;
  itemCount?: number;
  insightCount?: number;
  highConfidenceCount?: number;
  domain?: string;
  notes?: string[];
}

export interface ResearchOpportunity {
  title: string;
  summary: string;
  theme: string;
  priority: "high" | "medium" | "low";
  confidence: ResearchConfidence;
  evidenceInsightIds: string[];
  sourceCount: number;
}

export interface ResearchRisk {
  title: string;
  summary: string;
  theme: string;
  severity: "high" | "medium" | "low";
  evidenceInsightIds: string[];
  sourceCount: number;
}

export interface ResearchContradiction {
  topic: string;
  positiveInsightIds: string[];
  negativeInsightIds: string[];
  summary: string;
}

export interface ResearchSummarySnapshot {
  narrative: string;
  topThemes: string[];
  topOpportunities: string[];
  topRisks: string[];
  contradictionCount: number;
  nextActions: string[];
  generatedAt: string;
  coverage: {
    sources: number;
    insights: number;
    highConfidence: number;
    personas: number;
    themes: number;
  };
}

export interface ResearchStore {
  insights: ResearchInsight[];
  personas: ResearchPersona[];
  themes: ResearchTheme[];
  sources: ResearchSourceRecord[];
  opportunities?: ResearchOpportunity[];
  risks?: ResearchRisk[];
  contradictions?: ResearchContradiction[];
  summary?: ResearchSummarySnapshot;
}

interface ResponseRecord {
  response: string;
  actor?: string;
  role?: string;
  rating?: number;
  rowNumber: number;
}

interface SignalGroup {
  signal: string;
  responses: ResponseRecord[];
  categories: Map<string, number>;
  sentiments: Map<ResearchSentiment, number>;
}

const RESPONSE_HEADERS = ["response", "answer", "feedback", "comment", "quote", "note"];
const RATING_HEADERS = ["rating", "score", "nps", "satisfaction", "csat"];
const ACTOR_HEADERS = ["user", "participant", "name", "respondent", "customer"];
const ROLE_HEADERS = ["role", "title", "segment", "persona", "job"];

export class ResearchEngine {
  private log = createLogger("research");
  private config: ResearchConfig;
  private store: ResearchStore = createEmptyStore();
  private insightCounter = 0;
  private insightHashes = new Set<string>();

  constructor(config: ResearchConfig) {
    this.config = config;
  }

  async load(): Promise<void> {
    await mkdir(this.config.outputDir, { recursive: true });

    try {
      const raw = await readFile(join(this.config.outputDir, "insights.json"), "utf-8");
      const parsed = JSON.parse(raw);
      this.store = normalizeResearchStore(parsed);
      this.insightCounter = getInsightCounter(this.store.insights);
      this.insightHashes.clear();
      for (const insight of this.store.insights) {
        this.insightHashes.add(insightContentHash(insight.finding));
      }
    } catch {
      this.store = createEmptyStore();
      this.insightCounter = 0;
      this.insightHashes.clear();
    }
  }

  async fromStickies(stickies: StickyNote[]): Promise<ParsedResearch> {
    this.emitEvent("info", `Processing ${stickies.length} stickies...`);

    const beforeCount = this.store.insights.length;
    const parsed = clusterStickies(stickies);
    const themes = extractThemes(parsed.clusters);

    for (const theme of themes) {
      const themeText = `Theme: ${theme.theme}`;
      const category = inferResearchCategory(theme.evidence.join(" "), ["stickies", "qualitative"]);
      const entities = extractResearchEntities(`${themeText} ${theme.evidence.join(" ")}`);
      const signalTags = extractResearchSignals(themeText, [category, "stickies"], entities);

      this.addInsight({
        finding: themeText,
        confidence: theme.evidence.length >= 5 ? "high" : theme.evidence.length >= 3 ? "medium" : "low",
        source: "figjam-stickies",
        evidence: theme.evidence.slice(0, 8),
        tags: ["stickies", "qualitative", category],
        category,
        sentiment: detectResearchSentiment(theme.evidence.join(" ")),
        entities,
        signalTags,
        sourceType: "figjam-stickies",
      });
    }

    for (const sticky of stickies) {
      const text = sticky.text.trim();
      if (text.length < 35) continue;
      const category = inferResearchCategory(text, ["stickies", "raw-note"]);
      const entities = extractResearchEntities(text);
      this.addInsight({
        finding: buildCategorizedFinding(text, category),
        confidence: text.length > 140 ? "medium" : "low",
        source: "figjam-stickies",
        evidence: [text],
        tags: ["stickies", "raw-note", category],
        category,
        sentiment: detectResearchSentiment(text),
        entities,
        signalTags: extractResearchSignals(text, [category, "stickies"], entities),
        sourceType: "figjam-sticky",
      });
    }

    const addedInsights = this.store.insights.slice(beforeCount);
    this.recordSource({
      name: "figjam-stickies",
      type: "figjam-stickies",
      processedAt: new Date().toISOString(),
      itemCount: stickies.length,
      insightCount: addedInsights.length,
      highConfidenceCount: addedInsights.filter((insight) => insight.confidence === "high").length,
      notes: [
        `${themes.length} clustered theme${themes.length === 1 ? "" : "s"}`,
        `${parsed.unclustered.length} unclustered sticky${parsed.unclustered.length === 1 ? "" : "ies"}`,
      ],
    });

    await this.save();
    this.emitEvent("success", `Processed ${stickies.length} stickies into ${themes.length} themes`);

    return parsed;
  }

  async fromFile(filePath: string): Promise<void> {
    this.emitEvent("info", `Processing file: ${filePath}`);

    const beforeCount = this.store.insights.length;
    const data = await parseExcel(filePath);
    const headers = data.headers.map((header) => header.toLowerCase());

    const responseIdx = findHeaderIndex(headers, RESPONSE_HEADERS);
    const ratingIdx = findHeaderIndex(headers, RATING_HEADERS);
    const actorIdx = findHeaderIndex(headers, ACTOR_HEADERS);
    const roleIdx = findHeaderIndex(headers, ROLE_HEADERS);

    const responses: ResponseRecord[] = responseIdx === -1
      ? []
      : data.rows.flatMap((row, index) => {
          const response = toText(row[responseIdx]);
          if (response.length < 12) return [];
          return [{
            response,
            actor: actorIdx === -1 ? undefined : toText(row[actorIdx]) || undefined,
            role: roleIdx === -1 ? undefined : toText(row[roleIdx]) || undefined,
            rating: ratingIdx === -1 ? undefined : toNumber(row[ratingIdx]),
            rowNumber: index + 2,
          }];
        });

    for (const entry of responses.slice(0, 80)) {
      const categoryTags = ["survey", "qualitative"];
      if (entry.role) categoryTags.push(normalizeTag(entry.role));
      const category = inferResearchCategory(entry.response, categoryTags);
      const entities = extractResearchEntities(entry.response);
      const signalTags = extractResearchSignals(entry.response, [...categoryTags, category], entities);
      const evidence = [`Row ${entry.rowNumber}: ${entry.response}`];
      if (typeof entry.rating === "number") evidence.push(`Rating: ${entry.rating}`);
      if (entry.actor) evidence.push(`Participant: ${entry.actor}`);
      if (entry.role) evidence.push(`Role: ${entry.role}`);

      this.addInsight({
        finding: buildCategorizedFinding(entry.response, category),
        confidence: deriveResponseConfidence(entry.response, entry.rating),
        source: filePath,
        evidence,
        tags: unique([...categoryTags, category]),
        category,
        sentiment: detectResearchSentiment(entry.response),
        entities,
        signalTags,
        actor: entry.actor ?? entry.role,
        sourceType: filePath.toLowerCase().endsWith(".csv") ? "csv" : "excel",
      });
    }

    const groupedSignals = buildSignalGroups(responses);
    for (const group of groupedSignals.slice(0, 8)) {
      const dominantCategory = topKey(group.categories) ?? "general";
      const dominantSentiment = topKey(group.sentiments) ?? "neutral";
      this.addInsight({
        finding: `Repeated survey signal: ${group.signal} came up in ${group.responses.length} responses`,
        confidence: group.responses.length >= 4 ? "high" : "medium",
        source: filePath,
        evidence: group.responses.slice(0, 5).map((entry) => entry.response),
        tags: ["survey", "pattern", dominantCategory, normalizeTag(group.signal)],
        category: dominantCategory,
        sentiment: dominantSentiment,
        entities: extractResearchEntities(group.responses.map((entry) => entry.response).join(" ")),
        signalTags: [normalizeTag(group.signal)],
        sourceType: filePath.toLowerCase().endsWith(".csv") ? "csv" : "excel",
      });
    }

    if (ratingIdx !== -1) {
      const ratings = data.rows
        .map((row) => toNumber(row[ratingIdx]))
        .filter((value): value is number => typeof value === "number");

      if (ratings.length > 0) {
        const avg = ratings.reduce((sum, value) => sum + value, 0) / ratings.length;
        const min = Math.min(...ratings);
        const max = Math.max(...ratings);
        this.addInsight({
          finding: `Average rating: ${avg.toFixed(1)} (range: ${min}-${max}, n=${ratings.length})`,
          confidence: ratings.length > 30 ? "high" : ratings.length > 10 ? "medium" : "low",
          source: filePath,
          evidence: [`Mean: ${avg.toFixed(2)}`, `Min: ${min}`, `Max: ${max}`, `N: ${ratings.length}`],
          tags: ["survey", "quantitative", "rating"],
          category: "opinion",
          sentiment: avg >= 7 ? "positive" : avg <= 4 ? "negative" : "neutral",
          signalTags: ["rating", "satisfaction"],
          sourceType: filePath.toLowerCase().endsWith(".csv") ? "csv" : "excel",
        });
      }
    }

    if (responses.length > 0 && (actorIdx !== -1 || roleIdx !== -1)) {
      const actorCount = new Set(responses.map((entry) => entry.actor).filter(Boolean)).size;
      const roleCount = new Set(responses.map((entry) => entry.role).filter(Boolean)).size;
      this.addInsight({
        finding: `Survey coverage spans ${actorCount || responses.length} participant${actorCount === 1 ? "" : "s"}${roleCount > 0 ? ` across ${roleCount} role${roleCount === 1 ? "" : "s"}` : ""}`,
        confidence: responses.length >= 12 ? "medium" : "low",
        source: filePath,
        evidence: [
          `${responses.length} response${responses.length === 1 ? "" : "s"} analyzed`,
          actorCount > 0 ? `${actorCount} named participant${actorCount === 1 ? "" : "s"}` : "participants unnamed",
          roleCount > 0 ? `${roleCount} distinct role${roleCount === 1 ? "" : "s"}` : "role data unavailable",
        ],
        tags: ["survey", "coverage", "participant-mix"],
        category: "context",
        sentiment: "neutral",
        signalTags: ["coverage", "participant mix"],
        sourceType: filePath.toLowerCase().endsWith(".csv") ? "csv" : "excel",
      });
    }

    const addedInsights = this.store.insights.slice(beforeCount);
    const sourceType = filePath.toLowerCase().endsWith(".csv") ? "csv" : "excel";
    const notes = [
      responseIdx !== -1 ? `${responses.length} qualitative response${responses.length === 1 ? "" : "s"}` : "no qualitative response column detected",
      ratingIdx !== -1 ? "rating data present" : "no rating column detected",
    ];

    this.recordSource({
      name: filePath,
      type: sourceType,
      processedAt: new Date().toISOString(),
      itemCount: data.rows.length,
      insightCount: addedInsights.length,
      highConfidenceCount: addedInsights.filter((insight) => insight.confidence === "high").length,
      notes,
    });

    await this.save();
    this.emitEvent("success", `Processed ${data.rows.length} rows from "${data.sheetName}"`);
  }

  async synthesize(): Promise<{ themes: ResearchTheme[]; summary: string }> {
    this.emitEvent("info", "Synthesizing research...");

    const synthesis = synthesizeResearch(this.store);
    this.store.themes = synthesis.themes;
    this.store.personas = synthesis.personas;
    this.store.opportunities = synthesis.opportunities;
    this.store.risks = synthesis.risks;
    this.store.contradictions = synthesis.contradictions;
    this.store.summary = synthesis.summary;

    await this.save();

    this.emitEvent("success", synthesis.summary.narrative);
    return { themes: synthesis.themes, summary: synthesis.summary.narrative };
  }

  async generateReport(): Promise<string> {
    const report = generateResearchReportMarkdown(this.store);
    const reportPath = join(this.config.outputDir, "reports", "report.md");
    await mkdir(join(this.config.outputDir, "reports"), { recursive: true });
    await writeFile(reportPath, report);
    return report;
  }

  getInsights(): ResearchInsight[] {
    return this.store.insights;
  }

  getStore(): ResearchStore {
    return this.store;
  }

  async fromTranscript(filePath: string, label?: string): Promise<TranscriptAnalysis> {
    this.emitEvent("info", `Processing transcript: ${filePath}`);

    const beforeCount = this.store.insights.length;
    const text = await readFile(filePath, "utf-8");
    const { parseTranscript } = await import("./transcript-parser.js");
    const analysis = parseTranscript(text);
    const sourceName = label ?? filePath;

    for (const insight of analysis.insights) {
      const entities = extractResearchEntities(`${insight.finding} ${insight.quote}`);
      this.addInsight({
        finding: insight.finding,
        confidence: insight.confidence,
        source: sourceName,
        evidence: [insight.quote],
        tags: ["interview", "qualitative", insight.category, insight.sentiment],
        category: insight.category,
        sentiment: insight.sentiment,
        entities,
        signalTags: extractResearchSignals(insight.finding, [insight.category, insight.sentiment], entities),
        actor: insight.speaker,
        sourceType: "transcript",
        supportingSources: insight.timestamp ? [insight.timestamp] : undefined,
      });
    }

    const totalInsights = analysis.insights.length;
    if (totalInsights > 0) {
      const pct = (count: number) => Math.round((count / totalInsights) * 100);
      this.addInsight({
        finding: `Sentiment analysis: ${pct(analysis.sentiment.positive)}% positive, ${pct(analysis.sentiment.negative)}% negative, ${pct(analysis.sentiment.mixed)}% mixed (${analysis.speakers.length} speakers, ${totalInsights} insights)`,
        confidence: totalInsights > 10 ? "high" : "medium",
        source: sourceName,
        evidence: [
          `Total insights: ${totalInsights}`,
          `Speakers: ${analysis.speakers.map((speaker) => speaker.name).join(", ")}`,
        ],
        tags: ["interview", "quantitative", "sentiment"],
        category: "opinion",
        sentiment: analysis.sentiment.negative > analysis.sentiment.positive
          ? "negative"
          : analysis.sentiment.positive > analysis.sentiment.negative
            ? "positive"
            : "neutral",
        signalTags: ["sentiment", "interview health"],
        sourceType: "transcript",
      });
    }

    const addedInsights = this.store.insights.slice(beforeCount);
    this.recordSource({
      name: sourceName,
      type: "transcript",
      processedAt: new Date().toISOString(),
      itemCount: analysis.segments.length,
      insightCount: addedInsights.length,
      highConfidenceCount: addedInsights.filter((insight) => insight.confidence === "high").length,
      notes: [
        `${analysis.speakers.length} speaker${analysis.speakers.length === 1 ? "" : "s"}`,
        `${analysis.topicFlow.length} topic${analysis.topicFlow.length === 1 ? "" : "s"} tracked`,
      ],
    });

    await this.save();
    this.emitEvent("success", analysis.summary);

    return analysis;
  }

  async fromUrls(topic: string, urls: string[]): Promise<WebResearchResult> {
    this.emitEvent("info", `Web research: "${topic}" from ${urls.length} URLs`);

    const beforeCount = this.store.insights.length;
    const { executeWebResearch } = await import("./web-researcher.js");
    const result = await executeWebResearch(topic, urls);

    for (const finding of result.findings) {
      const source = finding.sourceUrls[0] ?? `web:${topic}`;
      const truncated = finding.text.length > 220 ? `${finding.text.slice(0, 217)}...` : finding.text;
      this.addInsight({
        finding: buildCategorizedFinding(truncated, finding.category),
        confidence: finding.confidence,
        source,
        evidence: finding.sourceUrls,
        tags: unique(["web-research", finding.category, ...finding.entities.slice(0, 5).map(normalizeTag)]),
        category: finding.category,
        sentiment: detectResearchSentiment(finding.text),
        entities: finding.entities,
        signalTags: extractResearchSignals(finding.text, [finding.category], finding.entities),
        sourceType: "web",
        supportingSources: finding.sourceUrls,
      });
    }

    for (const source of result.sources) {
      const relatedFindings = result.findings.filter((finding) => finding.sourceUrls.includes(source.url));
      this.recordSource({
        name: source.url,
        type: "web",
        processedAt: source.fetchedAt,
        itemCount: 1,
        insightCount: relatedFindings.length,
        highConfidenceCount: relatedFindings.filter((finding) => finding.confidence === "high").length,
        domain: source.domain,
        notes: [
          source.title,
          `relevance ${source.relevanceScore}`,
        ],
      });
    }

    const addedInsights = this.store.insights.slice(beforeCount);
    if (result.gaps.length > 0) {
      this.recordSource({
        name: `web-research:${topic}`,
        type: "web-summary",
        processedAt: result.researchedAt,
        itemCount: result.sources.length,
        insightCount: addedInsights.length,
        highConfidenceCount: addedInsights.filter((insight) => insight.confidence === "high").length,
        notes: result.gaps.slice(0, 4),
      });
    }

    await this.save();
    this.emitEvent("success", result.summary);

    return result;
  }

  private addInsight(data: Omit<ResearchInsight, "id" | "createdAt">): ResearchInsight | null {
    const hash = insightContentHash(data.finding);
    if (this.insightHashes.has(hash)) {
      this.log.debug({ finding: data.finding.slice(0, 60) }, "Skipping duplicate insight");
      return null;
    }

    const insight: ResearchInsight = {
      ...data,
      id: `insight-${++this.insightCounter}`,
      createdAt: new Date().toISOString(),
      evidence: unique(data.evidence.filter(Boolean)),
      tags: unique(data.tags.filter(Boolean)),
      entities: data.entities ? unique(data.entities.filter(Boolean)) : undefined,
      signalTags: data.signalTags ? unique(data.signalTags.filter(Boolean)) : undefined,
      supportingSources: data.supportingSources ? unique(data.supportingSources.filter(Boolean)) : undefined,
    };

    this.insightHashes.add(hash);
    this.store.insights.push(insight);
    return insight;
  }

  private recordSource(source: ResearchSourceRecord): void {
    const next: ResearchSourceRecord = {
      ...source,
      notes: source.notes ? unique(source.notes.filter(Boolean)) : undefined,
    };

    const existingIndex = this.store.sources.findIndex(
      (entry) => entry.name === next.name && entry.type === next.type,
    );

    if (existingIndex === -1) {
      this.store.sources.push(next);
      return;
    }

    const previous = this.store.sources[existingIndex];
    this.store.sources[existingIndex] = {
      ...previous,
      ...next,
      itemCount: next.itemCount ?? previous.itemCount,
      insightCount: next.insightCount ?? previous.insightCount,
      highConfidenceCount: next.highConfidenceCount ?? previous.highConfidenceCount,
      domain: next.domain ?? previous.domain,
      notes: unique([...(previous.notes ?? []), ...(next.notes ?? [])]),
      processedAt: next.processedAt > previous.processedAt ? next.processedAt : previous.processedAt,
    };
  }

  private async save(): Promise<void> {
    await mkdir(this.config.outputDir, { recursive: true });
    await writeFile(join(this.config.outputDir, "insights.json"), JSON.stringify(this.store, null, 2));
    await this.writeMarkdownNotes();
  }

  private async writeMarkdownNotes(): Promise<void> {
    const notesDir = join(this.config.outputDir, "notes");
    await mkdir(notesDir, { recursive: true });

    for (const insight of this.store.insights) {
      const icon = insight.confidence === "high" ? "■" : insight.confidence === "medium" ? "◧" : "□";
      const lines = [
        "---",
        `id: ${insight.id}`,
        `confidence: ${insight.confidence}`,
        `source: ${insight.source}`,
        `tags: [${insight.tags.map((tag) => `"${tag}"`).join(", ")}]`,
        `created: ${insight.createdAt}`,
        insight.category ? `category: ${insight.category}` : "",
        insight.sentiment ? `sentiment: ${insight.sentiment}` : "",
        "---",
        "",
        `# ${icon} ${insight.finding}`,
        "",
        `**Confidence:** ${insight.confidence}`,
        `**Source:** ${insight.source}`,
        insight.actor ? `**Actor:** ${insight.actor}` : "",
        "",
      ].filter(Boolean);

      if (insight.evidence.length > 0) {
        lines.push("## Evidence", "");
        for (const evidence of insight.evidence) {
          lines.push(`> ${evidence}`, "");
        }
      }

      if (insight.signalTags && insight.signalTags.length > 0) {
        lines.push("## Signals", "");
        lines.push(insight.signalTags.map((signal) => `\`${signal}\``).join(" "), "");
      }

      const relatedThemes = this.store.themes.filter((theme) => theme.insights.includes(insight.id));
      if (relatedThemes.length > 0) {
        lines.push("## Related Themes", "");
        for (const theme of relatedThemes) {
          lines.push(`- [[theme-${slugify(theme.name)}]]`);
        }
        lines.push("");
      }

      await writeFile(join(notesDir, `${insight.id}.md`), lines.join("\n"));
    }

    for (const theme of this.store.themes) {
      const lines = [
        "---",
        "type: theme",
        `name: ${theme.name}`,
        `frequency: ${theme.frequency}`,
        theme.confidence ? `confidence: ${theme.confidence}` : "",
        theme.sourceCount ? `sourceCount: ${theme.sourceCount}` : "",
        "---",
        "",
        `# Theme: ${theme.name}`,
        "",
        theme.description,
        "",
        `Frequency: ${theme.frequency}`,
        theme.sourceCount ? `Sources: ${theme.sourceCount}` : "",
        theme.confidence ? `Confidence: ${theme.confidence}` : "",
        "",
        "## Related Insights",
        "",
        ...theme.insights.map((insightId) => `- [[${insightId}]]`),
        "",
      ].filter(Boolean);

      await writeFile(join(notesDir, `theme-${slugify(theme.name)}.md`), lines.join("\n"));
    }

    for (const persona of this.store.personas) {
      const lines = [
        "---",
        "type: persona",
        `name: ${persona.name}`,
        `role: ${persona.role}`,
        persona.confidence ? `confidence: ${persona.confidence}` : "",
        "---",
        "",
        `# Persona: ${persona.name}`,
        "",
        `**Role:** ${persona.role}`,
        persona.quote ? `**Quote:** "${persona.quote}"` : "",
        "",
        persona.goals.length > 0 ? "## Goals" : "",
        ...persona.goals.map((goal) => `- ${goal}`),
        persona.goals.length > 0 ? "" : "",
        persona.painPoints.length > 0 ? "## Pain Points" : "",
        ...persona.painPoints.map((painPoint) => `- ${painPoint}`),
        persona.painPoints.length > 0 ? "" : "",
        persona.behaviors.length > 0 ? "## Behaviors" : "",
        ...persona.behaviors.map((behavior) => `- ${behavior}`),
        "",
      ].filter(Boolean);

      await writeFile(join(notesDir, `persona-${slugify(persona.name)}.md`), lines.join("\n"));
    }

    if (this.store.summary) {
      const lines = [
        "---",
        "type: summary",
        `generated: ${this.store.summary.generatedAt}`,
        "---",
        "",
        "# Research Summary",
        "",
        this.store.summary.narrative,
        "",
        "## Top Themes",
        "",
        ...this.store.summary.topThemes.map((theme) => `- ${theme}`),
        "",
        "## Top Opportunities",
        "",
        ...this.store.summary.topOpportunities.map((item) => `- ${item}`),
        "",
        "## Top Risks",
        "",
        ...this.store.summary.topRisks.map((item) => `- ${item}`),
        "",
        "## Next Actions",
        "",
        ...this.store.summary.nextActions.map((action) => `- ${action}`),
        "",
      ];
      await writeFile(join(notesDir, "summary.md"), lines.join("\n"));
    }

    await this.writeDecisionNotes(notesDir);
  }

  private async writeDecisionNotes(notesDir: string): Promise<void> {
    for (const opportunity of this.store.opportunities ?? []) {
      const lines = [
        "---",
        "type: opportunity",
        `theme: ${opportunity.theme}`,
        `priority: ${opportunity.priority}`,
        `confidence: ${opportunity.confidence}`,
        "---",
        "",
        `# ${opportunity.title}`,
        "",
        opportunity.summary,
        "",
        "## Evidence",
        "",
        ...opportunity.evidenceInsightIds.map((insightId) => `- [[${insightId}]]`),
        "",
      ];
      await writeFile(join(notesDir, `opportunity-${slugify(opportunity.theme)}.md`), lines.join("\n"));
    }

    for (const risk of this.store.risks ?? []) {
      const lines = [
        "---",
        "type: risk",
        `theme: ${risk.theme}`,
        `severity: ${risk.severity}`,
        "---",
        "",
        `# ${risk.title}`,
        "",
        risk.summary,
        "",
        "## Evidence",
        "",
        ...risk.evidenceInsightIds.map((insightId) => `- [[${insightId}]]`),
        "",
      ];
      await writeFile(join(notesDir, `risk-${slugify(risk.theme)}.md`), lines.join("\n"));
    }

    for (const contradiction of this.store.contradictions ?? []) {
      const lines = [
        "---",
        "type: contradiction",
        `topic: ${contradiction.topic}`,
        "---",
        "",
        `# ${contradiction.topic}`,
        "",
        contradiction.summary,
        "",
        "## Positive Evidence",
        "",
        ...contradiction.positiveInsightIds.map((insightId) => `- [[${insightId}]]`),
        "",
        "## Negative Evidence",
        "",
        ...contradiction.negativeInsightIds.map((insightId) => `- [[${insightId}]]`),
        "",
      ];
      await writeFile(join(notesDir, `contradiction-${slugify(contradiction.topic)}.md`), lines.join("\n"));
    }
  }

  private emitEvent(type: MemoireEvent["type"], message: string): void {
    this.config.onEvent?.({
      type,
      source: "research",
      message,
      timestamp: new Date(),
    });
  }
}

function createEmptyStore(): ResearchStore {
  return {
    insights: [],
    personas: [],
    themes: [],
    sources: [],
    opportunities: [],
    risks: [],
    contradictions: [],
  };
}

function normalizeResearchStore(input: unknown): ResearchStore {
  const value = input && typeof input === "object" ? input as Record<string, unknown> : {};
  return {
    insights: Array.isArray(value.insights) ? value.insights.map(normalizeInsight) : [],
    personas: Array.isArray(value.personas) ? value.personas.map(normalizePersona) : [],
    themes: Array.isArray(value.themes) ? value.themes.map(normalizeTheme) : [],
    sources: Array.isArray(value.sources) ? value.sources.map(normalizeSourceRecord) : [],
    opportunities: Array.isArray(value.opportunities) ? value.opportunities.map(normalizeOpportunity) : [],
    risks: Array.isArray(value.risks) ? value.risks.map(normalizeRisk) : [],
    contradictions: Array.isArray(value.contradictions) ? value.contradictions.map(normalizeContradiction) : [],
    summary: normalizeSummary(value.summary),
  };
}

function normalizeInsight(input: unknown): ResearchInsight {
  const value = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const finding = typeof value.finding === "string" ? value.finding : "Untitled insight";
  return {
    id: typeof value.id === "string" ? value.id : `insight-${Date.now().toString(36)}`,
    finding,
    confidence: isConfidence(value.confidence) ? value.confidence : "low",
    source: typeof value.source === "string" ? value.source : "unknown",
    evidence: Array.isArray(value.evidence) ? value.evidence.map(String) : [],
    tags: Array.isArray(value.tags) ? value.tags.map(String) : [],
    createdAt: typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString(),
    category: typeof value.category === "string" ? value.category : inferResearchCategory(finding),
    sentiment: isSentiment(value.sentiment) ? value.sentiment : detectResearchSentiment(finding),
    entities: Array.isArray(value.entities) ? value.entities.map(String) : extractResearchEntities(finding),
    signalTags: Array.isArray(value.signalTags)
      ? value.signalTags.map(String)
      : extractResearchSignals(finding, Array.isArray(value.tags) ? value.tags.map(String) : [], extractResearchEntities(finding)),
    actor: typeof value.actor === "string" ? value.actor : undefined,
    sourceType: typeof value.sourceType === "string" ? value.sourceType : undefined,
    supportingSources: Array.isArray(value.supportingSources) ? value.supportingSources.map(String) : undefined,
  };
}

function normalizePersona(input: unknown): ResearchPersona {
  const value = input && typeof input === "object" ? input as Record<string, unknown> : {};
  return {
    name: typeof value.name === "string" ? value.name : "Unknown Persona",
    role: typeof value.role === "string" ? value.role : "participant",
    goals: Array.isArray(value.goals) ? value.goals.map(String) : [],
    painPoints: Array.isArray(value.painPoints) ? value.painPoints.map(String) : [],
    behaviors: Array.isArray(value.behaviors) ? value.behaviors.map(String) : [],
    source: typeof value.source === "string" ? value.source : "unknown",
    quote: typeof value.quote === "string" ? value.quote : undefined,
    confidence: isConfidence(value.confidence) ? value.confidence : undefined,
    evidenceInsightIds: Array.isArray(value.evidenceInsightIds) ? value.evidenceInsightIds.map(String) : undefined,
  };
}

function normalizeTheme(input: unknown): ResearchTheme {
  const value = input && typeof input === "object" ? input as Record<string, unknown> : {};
  return {
    name: typeof value.name === "string" ? value.name : "Untitled Theme",
    description: typeof value.description === "string" ? value.description : "",
    insights: Array.isArray(value.insights) ? value.insights.map(String) : [],
    frequency: typeof value.frequency === "number" ? value.frequency : 0,
    sourceCount: typeof value.sourceCount === "number" ? value.sourceCount : undefined,
    confidence: isConfidence(value.confidence) ? value.confidence : undefined,
    signalTags: Array.isArray(value.signalTags) ? value.signalTags.map(String) : undefined,
    positiveCount: typeof value.positiveCount === "number" ? value.positiveCount : undefined,
    negativeCount: typeof value.negativeCount === "number" ? value.negativeCount : undefined,
  };
}

function normalizeSourceRecord(input: unknown): ResearchSourceRecord {
  const value = input && typeof input === "object" ? input as Record<string, unknown> : {};
  return {
    name: typeof value.name === "string" ? value.name : "unknown",
    type: typeof value.type === "string" ? value.type : "unknown",
    processedAt: typeof value.processedAt === "string" ? value.processedAt : new Date().toISOString(),
    itemCount: typeof value.itemCount === "number" ? value.itemCount : undefined,
    insightCount: typeof value.insightCount === "number" ? value.insightCount : undefined,
    highConfidenceCount: typeof value.highConfidenceCount === "number" ? value.highConfidenceCount : undefined,
    domain: typeof value.domain === "string" ? value.domain : undefined,
    notes: Array.isArray(value.notes) ? value.notes.map(String) : undefined,
  };
}

function normalizeOpportunity(input: unknown): ResearchOpportunity {
  const value = input && typeof input === "object" ? input as Record<string, unknown> : {};
  return {
    title: typeof value.title === "string" ? value.title : "Untitled Opportunity",
    summary: typeof value.summary === "string" ? value.summary : "",
    theme: typeof value.theme === "string" ? value.theme : "General",
    priority: value.priority === "high" || value.priority === "medium" || value.priority === "low" ? value.priority : "low",
    confidence: isConfidence(value.confidence) ? value.confidence : "low",
    evidenceInsightIds: Array.isArray(value.evidenceInsightIds) ? value.evidenceInsightIds.map(String) : [],
    sourceCount: typeof value.sourceCount === "number" ? value.sourceCount : 0,
  };
}

function normalizeRisk(input: unknown): ResearchRisk {
  const value = input && typeof input === "object" ? input as Record<string, unknown> : {};
  return {
    title: typeof value.title === "string" ? value.title : "Untitled Risk",
    summary: typeof value.summary === "string" ? value.summary : "",
    theme: typeof value.theme === "string" ? value.theme : "General",
    severity: value.severity === "high" || value.severity === "medium" || value.severity === "low" ? value.severity : "low",
    evidenceInsightIds: Array.isArray(value.evidenceInsightIds) ? value.evidenceInsightIds.map(String) : [],
    sourceCount: typeof value.sourceCount === "number" ? value.sourceCount : 0,
  };
}

function normalizeContradiction(input: unknown): ResearchContradiction {
  const value = input && typeof input === "object" ? input as Record<string, unknown> : {};
  return {
    topic: typeof value.topic === "string" ? value.topic : "General",
    positiveInsightIds: Array.isArray(value.positiveInsightIds) ? value.positiveInsightIds.map(String) : [],
    negativeInsightIds: Array.isArray(value.negativeInsightIds) ? value.negativeInsightIds.map(String) : [],
    summary: typeof value.summary === "string" ? value.summary : "",
  };
}

function normalizeSummary(input: unknown): ResearchSummarySnapshot | undefined {
  if (!input || typeof input !== "object") return undefined;
  const value = input as Record<string, unknown>;
  return {
    narrative: typeof value.narrative === "string" ? value.narrative : "",
    topThemes: Array.isArray(value.topThemes) ? value.topThemes.map(String) : [],
    topOpportunities: Array.isArray(value.topOpportunities) ? value.topOpportunities.map(String) : [],
    topRisks: Array.isArray(value.topRisks) ? value.topRisks.map(String) : [],
    contradictionCount: typeof value.contradictionCount === "number" ? value.contradictionCount : 0,
    nextActions: Array.isArray(value.nextActions) ? value.nextActions.map(String) : [],
    generatedAt: typeof value.generatedAt === "string" ? value.generatedAt : new Date().toISOString(),
    coverage: {
      sources: asNumber(value.coverage, "sources"),
      insights: asNumber(value.coverage, "insights"),
      highConfidence: asNumber(value.coverage, "highConfidence"),
      personas: asNumber(value.coverage, "personas"),
      themes: asNumber(value.coverage, "themes"),
    },
  };
}

function buildCategorizedFinding(text: string, category: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  const excerpt = trimmed.length > 160 ? `${trimmed.slice(0, 157)}...` : trimmed;
  const prefixMap: Record<string, string> = {
    "pain-point": "Pain point",
    "goal": "User goal",
    "behavior": "Behavior pattern",
    "need": "User need",
    "opinion": "User opinion",
    "feature-request": "Feature request",
    "workaround": "Workaround",
    "best-practice": "Best practice",
    "market-data": "Market signal",
    "technical-constraint": "Technical constraint",
    "regulatory": "Regulatory concern",
    "general": "Research finding",
    "context": "Research context",
    "user-need": "User need",
    "design-pattern": "Design pattern",
    "competitor-insight": "Competitor insight",
  };
  return `${prefixMap[category] ?? "Research finding"}: ${excerpt}`;
}

function deriveResponseConfidence(response: string, rating?: number): ResearchConfidence {
  if (response.length > 180 || typeof rating === "number") return "medium";
  if (response.length > 80) return "medium";
  return "low";
}

function buildSignalGroups(responses: ResponseRecord[]): SignalGroup[] {
  const groups = new Map<string, SignalGroup>();

  for (const entry of responses) {
    const category = inferResearchCategory(entry.response, ["survey"]);
    const sentiment = detectResearchSentiment(entry.response);
    const entities = extractResearchEntities(entry.response);
    const signals = extractResearchSignals(entry.response, [category, "survey"], entities, 3);

    for (const signal of signals.slice(0, 2)) {
      if (!signal) continue;
      const label = signal.split(" ").map(capitalize).join(" ");
      const group = groups.get(label) ?? {
        signal: label,
        responses: [],
        categories: new Map<string, number>(),
        sentiments: new Map<ResearchSentiment, number>(),
      };
      group.responses.push(entry);
      group.categories.set(category, (group.categories.get(category) ?? 0) + 1);
      group.sentiments.set(sentiment, (group.sentiments.get(sentiment) ?? 0) + 1);
      groups.set(label, group);
    }
  }

  return Array.from(groups.values())
    .filter((group) => group.responses.length >= 2)
    .sort((a, b) => b.responses.length - a.responses.length);
}

function findHeaderIndex(headers: string[], patterns: string[]): number {
  return headers.findIndex((header) => patterns.some((pattern) => header.includes(pattern)));
}

function toText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return undefined;
  const numeric = Number(value.trim());
  return Number.isFinite(numeric) ? numeric : undefined;
}

function topKey<T extends string>(map: Map<T, number>): T | undefined {
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeTag(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function asNumber(value: unknown, key: string): number {
  if (!value || typeof value !== "object") return 0;
  const record = value as Record<string, unknown>;
  return typeof record[key] === "number" ? record[key] as number : 0;
}

function isConfidence(value: unknown): value is ResearchConfidence {
  return value === "high" || value === "medium" || value === "low";
}

function isSentiment(value: unknown): value is ResearchSentiment {
  return value === "positive" || value === "negative" || value === "neutral" || value === "mixed";
}

function getInsightCounter(insights: ResearchInsight[]): number {
  return insights.reduce((max, insight) => {
    const match = insight.id.match(/^insight-(\d+)$/);
    if (!match) return max;
    const value = Number(match[1]);
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, insights.length);
}

function insightContentHash(finding: string): string {
  return createHash("sha256").update(finding.trim().toLowerCase()).digest("hex").slice(0, 16);
}
