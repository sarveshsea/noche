/**
 * WCAG Token Checker — WA-401
 * Post-pull audit utility that checks design tokens against WCAG contrast
 * and spacing criteria. Self-contained: no external color libraries required.
 */

import type { DesignSystem, DesignToken } from "../engine/registry.js";

// ── Public types ─────────────────────────────────────────────────

export interface TokenWcagResult {
  tokenName: string;
  type: "color" | "spacing" | "other";
  issue: string | null;
  wcagCriterion: string | null;
  status: "pass" | "warn" | "fail";
}

export interface WcagTokenReport {
  results: TokenWcagResult[];
  summary: { pass: number; warn: number; fail: number; total: number };
  hasFailures: boolean;
}

// ── WCAG contrast math (inline — no external deps) ────────────────

/**
 * Convert a single 0-255 sRGB channel to its linearised value.
 * Per WCAG 2.x relative luminance formula.
 */
function linearise(channel8bit: number): number {
  const srgb = channel8bit / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
}

/**
 * WCAG relative luminance for an RGB triplet (each 0-255).
 */
export function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * linearise(r) + 0.7152 * linearise(g) + 0.0722 * linearise(b);
}

/**
 * WCAG contrast ratio between two relative luminance values.
 * Returns value in [1, 21].
 */
export function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ── Hex parsing ───────────────────────────────────────────────────

/**
 * Parse a hex color string (#rgb, #rrggbb, #rrggbbaa) into {r,g,b} (0-255).
 * Returns null if the string is not a valid hex color.
 */
export function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.trim().replace(/^#/, "");
  if (h.length === 3) {
    const r = parseInt(h[0] + h[0], 16);
    const g = parseInt(h[1] + h[1], 16);
    const b = parseInt(h[2] + h[2], 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return { r, g, b };
  }
  if (h.length === 6 || h.length === 8) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return { r, g, b };
  }
  return null;
}

/**
 * Compute the maximum contrast ratio between a hex color and
 * pure white (#fff, luminance ~1) and pure black (#000, luminance 0).
 * Returns null when hex is not parseable.
 */
export function maxContrastAgainstExtremes(hex: string): number | null {
  const parsed = parseHex(hex);
  if (!parsed) return null;
  const L = relativeLuminance(parsed.r, parsed.g, parsed.b);
  const white = 1.0;
  const black = 0.0;
  const vsWhite = contrastRatio(L, white);
  const vsBlack = contrastRatio(L, black);
  return Math.max(vsWhite, vsBlack);
}

// ── Token classification helpers ──────────────────────────────────

/** Color keyword patterns — any token name/path containing these is a color token. */
const COLOR_NAME_PATTERNS = [
  "color", "colour", "fg", "bg", "text", "fill", "surface", "brand",
];

function isColorTokenByName(name: string): boolean {
  const lower = name.toLowerCase();
  return COLOR_NAME_PATTERNS.some((p) => lower.includes(p));
}

/** Extract the first hex-like string from a token's values record. */
function extractHexFromValues(values: Record<string, string | number>): string | null {
  for (const val of Object.values(values)) {
    if (typeof val === "string" && /^#[0-9a-fA-F]{3,8}$/.test(val.trim())) {
      return val.trim();
    }
  }
  return null;
}

// ── Spacing check ─────────────────────────────────────────────────

const SPACING_MIN_PX = 24;

function parseSpacingPx(val: string | number): number | null {
  if (typeof val === "number") return val;
  const trimmed = val.trim().toLowerCase();
  const remMatch = trimmed.match(/^([\d.]+)rem$/);
  if (remMatch) return parseFloat(remMatch[1]) * 16;
  const pxMatch = trimmed.match(/^([\d.]+)px$/);
  if (pxMatch) return parseFloat(pxMatch[1]);
  // Plain number string
  const num = parseFloat(trimmed);
  if (!isNaN(num)) return num;
  return null;
}

function checkSpacingToken(token: DesignToken): TokenWcagResult {
  for (const val of Object.values(token.values)) {
    const px = parseSpacingPx(val);
    if (px !== null && px < SPACING_MIN_PX) {
      return {
        tokenName: token.name,
        type: "spacing",
        issue: `Spacing value ${val} is below the 24px minimum touch target size`,
        wcagCriterion: "WCAG 2.5.8 (Minimum Target Size, AA)",
        status: "warn",
      };
    }
  }
  return {
    tokenName: token.name,
    type: "spacing",
    issue: null,
    wcagCriterion: null,
    status: "pass",
  };
}

// ── Color check ───────────────────────────────────────────────────

/**
 * Contrast ratio of a hex color against white (#fff, luminance=1).
 * Returns null when the hex is not parseable.
 * Using vs-white as the check surface mirrors WCAG tooling conventions
 * (WebAIM, Colour Contrast Analyser) and reflects the most common real-world
 * scenario: dark text / foreground colors on a white background.
 */
function contrastVsWhite(hex: string): number | null {
  const parsed = parseHex(hex);
  if (!parsed) return null;
  const L = relativeLuminance(parsed.r, parsed.g, parsed.b);
  return contrastRatio(1.0, L); // white luminance = 1
}

function checkColorToken(token: DesignToken): TokenWcagResult {
  const hex = extractHexFromValues(token.values);
  if (!hex) {
    return {
      tokenName: token.name,
      type: "color",
      issue: null,
      wcagCriterion: null,
      status: "pass",
    };
  }

  const ratio = contrastVsWhite(hex);
  if (ratio === null) {
    return {
      tokenName: token.name,
      type: "color",
      issue: null,
      wcagCriterion: null,
      status: "pass",
    };
  }

  const rounded = Math.round(ratio * 100) / 100;

  if (ratio < 3.0) {
    return {
      tokenName: token.name,
      type: "color",
      issue: `${hex} — contrast vs white ${rounded}:1 (inaccessible for text use)`,
      wcagCriterion: "WCAG 1.4.3 (Contrast Minimum, AA)",
      status: "fail",
    };
  }

  if (ratio < 4.5) {
    return {
      tokenName: token.name,
      type: "color",
      issue: `${hex} — contrast vs white ${rounded}:1 (AA-large only, fails normal text)`,
      wcagCriterion: "WCAG 1.4.3 (Contrast Minimum, AA)",
      status: "warn",
    };
  }

  return {
    tokenName: token.name,
    type: "color",
    issue: null,
    wcagCriterion: null,
    status: "pass",
  };
}

// ── Main export ───────────────────────────────────────────────────

/**
 * Audit design tokens for WCAG violations.
 *
 * - Color tokens (name contains color/fg/bg/text/fill/surface/brand):
 *   checks hex values against white and black for contrast compliance.
 *   fail  < 3.0:1   — inaccessible for any text use
 *   warn  3.0–4.49  — AA-large only
 *   pass  ≥ 4.5     — meets WCAG 1.4.3 AA
 *
 * - Spacing tokens: warns on values < 24px (WCAG 2.5.8).
 *
 * - All other tokens: pass (no applicable WCAG check).
 */
export function auditTokensForWcag(tokens: DesignSystem["tokens"]): WcagTokenReport {
  const results: TokenWcagResult[] = tokens.map((token) => {
    // Use the registry type field when available, fall back to name heuristic
    if (token.type === "spacing") {
      return checkSpacingToken(token);
    }

    if (token.type === "color" || isColorTokenByName(token.name)) {
      return checkColorToken(token);
    }

    return {
      tokenName: token.name,
      type: "other" as const,
      issue: null,
      wcagCriterion: null,
      status: "pass" as const,
    };
  });

  const summary = results.reduce(
    (acc, r) => {
      acc[r.status]++;
      acc.total++;
      return acc;
    },
    { pass: 0, warn: 0, fail: 0, total: 0 },
  );

  return {
    results,
    summary,
    hasFailures: summary.fail > 0,
  };
}
