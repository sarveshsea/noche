#!/usr/bin/env node
/**
 * Build a fully standalone dashboard for embedding in Framer.
 * Patches API calls with hardcoded sample data, removes WebSocket hot-reload.
 * Output: preview/standalone/
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "fs";
import { join } from "path";

const SRC = join(import.meta.dirname, "..", "preview");
const OUT = join(SRC, "standalone");

mkdirSync(OUT, { recursive: true });

// ── Sample research data ──────────────────────────
const RESEARCH_DATA = JSON.stringify({
  insights: [
    { finding: "Users spend 40% of time switching between Figma and code editors", confidence: "high", source: "Interview Round 1", tags: ["workflow", "efficiency"] },
    { finding: "Design token naming conventions vary significantly across teams", confidence: "high", source: "Survey Q3", tags: ["tokens", "consistency"] },
    { finding: "Auto-generated components reduce handoff time by 60%", confidence: "medium", source: "Pilot Study", tags: ["codegen", "productivity"] },
    { finding: "Bidirectional sync reduces design drift by 80%", confidence: "high", source: "Case Study A", tags: ["sync", "quality"] },
    { finding: "Developers prefer spec-first workflows over design-first", confidence: "medium", source: "Interview Round 2", tags: ["workflow", "specs"] },
    { finding: "Agent orchestration enables parallel design reviews", confidence: "medium", source: "Pilot Study", tags: ["agents", "collaboration"] },
    { finding: "WCAG compliance checking catches 90% of contrast issues", confidence: "high", source: "Audit Results", tags: ["accessibility", "quality"] },
    { finding: "MCP integration reduces context switching by 45%", confidence: "medium", source: "Usage Metrics", tags: ["mcp", "efficiency"] },
  ],
  themes: [
    { name: "Workflow Efficiency", description: "Reducing context switches between design and code", frequency: 12, insights: [{}, {}, {}] },
    { name: "Design Token Governance", description: "Consistent naming and synchronization of tokens", frequency: 8, insights: [{}, {}] },
    { name: "Spec-Driven Development", description: "Structured specs as the source of truth", frequency: 6, insights: [{}] },
    { name: "Accessibility by Default", description: "WCAG compliance integrated into the pipeline", frequency: 5, insights: [{}] },
  ],
  personas: [
    { name: "Aria Chen", role: "Design Systems Lead", quote: "I need one source of truth that both designers and engineers trust.", goals: ["Maintain token consistency", "Reduce design drift", "Automate audits"], painPoints: ["Manual sync is error-prone", "Token naming conflicts"], behaviors: ["Reviews every token change", "Runs weekly audits"], source: "Interview Round 1" },
    { name: "Marcus Webb", role: "Frontend Engineer", quote: "Just give me a spec and get out of my way.", goals: ["Generate clean components", "Reduce handoff friction", "Type-safe props"], painPoints: ["Ambiguous design specs", "Inconsistent component APIs"], behaviors: ["Prefers CLI workflows", "Writes tests first"], source: "Interview Round 2" },
    { name: "Priya Sharma", role: "UX Researcher", quote: "Insights should flow directly into design decisions.", goals: ["Trace insights to specs", "Quantify design impact", "Share findings efficiently"], painPoints: ["Research gets lost in docs", "No feedback loop"], behaviors: ["Synthesizes weekly", "Tags everything"], source: "Survey Q3" },
  ],
  sources: [
    { name: "User Interview Transcripts (Round 1)", type: "transcript", processedAt: "2025-11-15T10:30:00Z" },
    { name: "Design System Survey Q3", type: "excel", processedAt: "2025-12-01T14:00:00Z" },
    { name: "Competitive Analysis", type: "web", processedAt: "2025-12-10T09:00:00Z" },
    { name: "FigJam Workshop Notes", type: "figjam-stickies", processedAt: "2026-01-05T16:00:00Z" },
    { name: "Pilot Study Results", type: "excel", processedAt: "2026-01-20T11:00:00Z" },
  ],
});

// ── Sample monitor data ──────────────────────────
const MONITOR_INIT = JSON.stringify({
  type: "init",
  data: {
    status: {
      port: 9224,
      clients: 2,
      recentClients: [
        { id: "client-a1b2", file: "Memoire Design System", editor: "figma/desktop", connectedAt: Date.now() - 3600000, lastPing: Date.now() - 5000 },
        { id: "client-c3d4", file: "Product Pages", editor: "figma/desktop", connectedAt: Date.now() - 1800000, lastPing: Date.now() - 2000 },
      ],
    },
    recentEvents: [
      { type: "plugin-connected", data: { file: "Memoire Design System", editor: "figma/desktop" }, ts: Date.now() - 3600000 },
      { type: "selection", data: { nodes: 3, types: ["COMPONENT", "FRAME"] }, ts: Date.now() - 1200000 },
      { type: "sync-data", data: { tokens: 42, components: 24, styles: 8 }, ts: Date.now() - 600000 },
      { type: "document-changed", data: { changes: 6 }, ts: Date.now() - 300000 },
      { type: "plugin-connected", data: { file: "Product Pages", editor: "figma/desktop" }, ts: Date.now() - 1800000 },
      { type: "selection", data: { nodes: 1, types: ["TEXT"] }, ts: Date.now() - 120000 },
      { type: "action-result", data: { action: "pull-tokens", success: true, count: 42 }, ts: Date.now() - 60000 },
    ],
  },
});

// ── WebSocket removal pattern ─────────────────────
const WS_SCRIPT_RE = /<script>\(function\(\)\{var w;function c\(\)\{w=new WebSocket[\s\S]*?<\/script>/g;

// ── Patch functions ──────────────────────────────

function patchIndex(html) {
  return html.replace(WS_SCRIPT_RE, "");
}

function patchDesignSystem(html) {
  return html.replace(WS_SCRIPT_RE, "");
}

function patchSpecs(html) {
  return html.replace(WS_SCRIPT_RE, "");
}

function patchChangelog(html) {
  return html.replace(WS_SCRIPT_RE, "");
}

function patchResearch(html) {
  // Replace the fetch call with inline data
  html = html.replace(
    /\(function\(\)\s*\{\s*fetch\('\/api\/research'\)[\s\S]*?\}\)\(\);/,
    `(function() {
  var data = ${RESEARCH_DATA};
  renderOverview(data);
  renderInsights(data);
  renderPersonas(data);
  renderThemes(data);
  renderSources(data);
  updateHeader(data);
  updateFooter(data);
})();`
  );
  html = html.replace(WS_SCRIPT_RE, "");
  return html;
}

function patchMonitor(html) {
  // Replace SSE connect + fetch with inline mock
  html = html.replace(
    /function connect\(\)\s*\{[\s\S]*?^\s*\}/m,
    `function connect() {
    $connDot.className = 'conn-dot connected';
    $connLabel.textContent = 'Connected to dashboard';
    $connMeta.textContent = 'port 9224';
    connectedAt = Date.now();
    dashboardPort = 9224;
    // Simulate init event
    var initMsg = ${MONITOR_INIT};
    handleEvent(initMsg);
  }`
  );
  // Replace periodic status poll
  html = html.replace(
    /setInterval\(function\(\)\s*\{[\s\S]*?fetch\('\/api\/status'\)[\s\S]*?\},\s*\d+\)/,
    `setInterval(function() { /* status poll disabled in standalone */ }, 999999)`
  );
  // Replace action POST with mock success
  html = html.replace(
    /fetch\('\/api\/action'[\s\S]*?\.catch[\s\S]*?\}/,
    `Promise.resolve().then(function() {
      addEventRow('action-result', { action: action, success: true }, Date.now(), true);
    })`
  );
  html = html.replace(WS_SCRIPT_RE, "");
  return html;
}

// ── Build ────────────────────────────────────────

const pages = [
  { file: "index.html", patch: patchIndex },
  { file: "design-system.html", patch: patchDesignSystem },
  { file: "specs.html", patch: patchSpecs },
  { file: "research.html", patch: patchResearch },
  { file: "monitor.html", patch: patchMonitor },
  { file: "changelog.html", patch: patchChangelog },
];

for (const { file, patch } of pages) {
  const src = readFileSync(join(SRC, file), "utf-8");
  const out = patch(src);
  writeFileSync(join(OUT, file), out);
  console.log(`  ${file} → standalone/${file}`);
}

console.log(`\nStandalone dashboard built in preview/standalone/`);
console.log("Deploy this folder to memoire.cv/dashboard-static/");
