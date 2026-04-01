/**
 * Intent Classifier — Categorizes natural language design intents.
 *
 * Extracted from orchestrator.ts for independent testability and reuse.
 */

// ── Types ────────────────────────────────────────────────

export type IntentCategory =
  | "token-update"
  | "component-create"
  | "component-modify"
  | "page-layout"
  | "dataviz-create"
  | "theme-change"
  | "spacing-system"
  | "typography-system"
  | "color-palette"
  | "figma-sync"
  | "code-generate"
  | "design-audit"
  | "design-system-init"
  | "responsive-layout"
  | "accessibility-check"
  | "general";

// ── Pattern Table ────────────────────────────────────────

export const INTENT_PATTERNS: [RegExp, IntentCategory][] = [
  // Token operations
  [/\b(color|palette|hue|shade|tint)\b/i, "color-palette"],
  [/\b(spacing|space|gap|padding|margin)\b/i, "spacing-system"],
  [/\b(font|typography|text|type\s?scale|heading)\b/i, "typography-system"],
  [/\b(theme|dark\s?mode|light\s?mode|brand)\b/i, "theme-change"],
  [/\b(token|variable|css\s?var)\b/i, "token-update"],

  // Component operations
  [/\b(create|new|add)\b.*\b(component|widget|element)\b/i, "component-create"],
  [/\b(update|modify|change|edit)\b.*\b(component|widget)\b/i, "component-modify"],
  [/\b(button|card|input|form|modal|dialog|table|nav|header|footer|sidebar)\b/i, "component-create"],

  // Layout operations
  [/\b(page|layout|screen|view)\b/i, "page-layout"],
  [/\b(responsive|breakpoint|mobile|tablet|desktop)\b/i, "responsive-layout"],

  // Dataviz
  [/\b(chart|graph|visualization|dataviz|dashboard\s?chart)\b/i, "dataviz-create"],

  // Meta operations
  [/\b(sync|push|figma)\b/i, "figma-sync"],
  [/\b(generate|build|code|compile)\b/i, "code-generate"],
  [/\b(audit|review|check|lint|validate)\b/i, "design-audit"],
  [/\b(accessibility|a11y|wcag|aria)\b/i, "accessibility-check"],
  [/\b(init|setup|bootstrap|scaffold)\b/i, "design-system-init"],
];

// ── Classifier ───────────────────────────────────────────

export function classifyIntent(intent: string): IntentCategory {
  // Prevent ReDoS with excessively long intent strings
  if (intent.length > 5000) return "general";

  for (const [pattern, category] of INTENT_PATTERNS) {
    if (pattern.test(intent)) return category;
  }
  return "general";
}
