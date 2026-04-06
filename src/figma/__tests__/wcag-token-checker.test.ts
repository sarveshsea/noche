/**
 * WA-405 — Unit tests for src/figma/wcag-token-checker.ts
 * Covers: contrast maths, hex parsing, color/spacing/other classification,
 * summary counts, hasFailures, and edge cases.
 */

import { describe, expect, it } from "vitest";
import {
  auditTokensForWcag,
  contrastRatio,
  maxContrastAgainstExtremes,
  parseHex,
  relativeLuminance,
} from "../wcag-token-checker.js";
import type { DesignToken } from "../../engine/registry.js";

// ── Helpers ───────────────────────────────────────────────────────

function makeToken(overrides: Partial<DesignToken> & { name: string }): DesignToken {
  return {
    collection: "Design Tokens",
    type: "other",
    values: {},
    cssVariable: `--${overrides.name}`,
    ...overrides,
  };
}

function colorToken(name: string, hex: string): DesignToken {
  return makeToken({ name, type: "color", values: { default: hex } });
}

function spacingToken(name: string, value: string | number): DesignToken {
  return makeToken({ name, type: "spacing", values: { default: value } });
}

// ── relativeLuminance ─────────────────────────────────────────────

describe("relativeLuminance", () => {
  it("returns 0 for black", () => {
    expect(relativeLuminance(0, 0, 0)).toBeCloseTo(0, 5);
  });

  it("returns ~1 for white", () => {
    expect(relativeLuminance(255, 255, 255)).toBeCloseTo(1, 5);
  });

  it("returns a value between 0 and 1 for mid-grey", () => {
    const L = relativeLuminance(128, 128, 128);
    expect(L).toBeGreaterThan(0);
    expect(L).toBeLessThan(1);
  });
});

// ── contrastRatio ─────────────────────────────────────────────────

describe("contrastRatio", () => {
  it("returns 21 for black vs white", () => {
    expect(contrastRatio(1, 0)).toBeCloseTo(21, 0);
  });

  it("returns 1 for same colour (no contrast)", () => {
    expect(contrastRatio(0.5, 0.5)).toBeCloseTo(1, 5);
  });

  it("is symmetric regardless of argument order", () => {
    const a = contrastRatio(0.8, 0.2);
    const b = contrastRatio(0.2, 0.8);
    expect(a).toBeCloseTo(b, 5);
  });
});

// ── parseHex ──────────────────────────────────────────────────────

describe("parseHex", () => {
  it("parses 6-digit hex", () => {
    const c = parseHex("#ff0000");
    expect(c).toEqual({ r: 255, g: 0, b: 0 });
  });

  it("parses 3-digit shorthand", () => {
    const c = parseHex("#f00");
    expect(c).toEqual({ r: 255, g: 0, b: 0 });
  });

  it("parses 8-digit hex (ignores alpha)", () => {
    const c = parseHex("#ff0000ff");
    expect(c).toEqual({ r: 255, g: 0, b: 0 });
  });

  it("returns null for non-hex string", () => {
    expect(parseHex("red")).toBeNull();
    expect(parseHex("rgb(255,0,0)")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseHex("")).toBeNull();
  });
});

// ── maxContrastAgainstExtremes ────────────────────────────────────

describe("maxContrastAgainstExtremes", () => {
  it("returns ~21 for #000000 (max contrast against white)", () => {
    const ratio = maxContrastAgainstExtremes("#000000");
    expect(ratio).not.toBeNull();
    expect(ratio!).toBeCloseTo(21, 0);
  });

  it("returns ~21 for #ffffff (max contrast against black)", () => {
    const ratio = maxContrastAgainstExtremes("#ffffff");
    expect(ratio).not.toBeNull();
    expect(ratio!).toBeCloseTo(21, 0);
  });

  it("returns null for unparseable string", () => {
    expect(maxContrastAgainstExtremes("not-a-color")).toBeNull();
  });
});

// ── auditTokensForWcag — non-color tokens ─────────────────────────

describe("auditTokensForWcag — non-color tokens", () => {
  it("returns pass for a radius token with no color keyword", () => {
    const tokens = [makeToken({ name: "radius/sm", type: "radius", values: { default: "4px" } })];
    const report = auditTokensForWcag(tokens);
    expect(report.results[0].status).toBe("pass");
    expect(report.results[0].type).toBe("other");
  });

  it("returns pass for a typography token", () => {
    const tokens = [makeToken({ name: "font/body", type: "typography", values: { default: "16px" } })];
    const report = auditTokensForWcag(tokens);
    expect(report.results[0].status).toBe("pass");
  });

  it("returns pass for a shadow token", () => {
    const tokens = [makeToken({ name: "elevation/card", type: "shadow", values: { default: "0 2px 8px rgba(0,0,0,0.1)" } })];
    const report = auditTokensForWcag(tokens);
    expect(report.results[0].status).toBe("pass");
  });
});

// ── auditTokensForWcag — color tokens (type field) ───────────────

describe("auditTokensForWcag — color tokens via type:color", () => {
  it("returns pass for #000000 (21:1 contrast)", () => {
    const report = auditTokensForWcag([colorToken("brand/primary", "#000000")]);
    expect(report.results[0].status).toBe("pass");
  });

  it("returns pass for #0000ff (8.59:1 contrast vs white)", () => {
    const report = auditTokensForWcag([colorToken("brand/blue", "#0000ff")]);
    expect(report.results[0].status).toBe("pass");
  });

  it("returns warn for #787878 (approx 4.4:1 vs white — AA-large only)", () => {
    // #787878 gives ~4.42:1 vs white — clearly in the 3.0–4.49 warn band
    const report = auditTokensForWcag([colorToken("fg/subtle", "#787878")]);
    expect(report.results[0].status).toBe("warn");
    expect(report.results[0].wcagCriterion).toContain("1.4.3");
  });

  it("returns fail for #e8e8e8 (approx 1.4:1 — inaccessible)", () => {
    const report = auditTokensForWcag([colorToken("surface/muted", "#e8e8e8")]);
    expect(report.results[0].status).toBe("fail");
    expect(report.results[0].issue).toContain("#e8e8e8");
  });

  it("returns pass for token with no hex value in values", () => {
    const token = makeToken({ name: "color/alias", type: "color", values: { default: "var(--primary)" } });
    const report = auditTokensForWcag([token]);
    expect(report.results[0].status).toBe("pass");
    expect(report.results[0].issue).toBeNull();
  });
});

// ── auditTokensForWcag — color tokens (name heuristic) ───────────

describe("auditTokensForWcag — color tokens via name heuristic", () => {
  it("detects 'text' in name and audits contrast", () => {
    const token = makeToken({ name: "text/muted", type: "other", values: { default: "#787878" } });
    const report = auditTokensForWcag([token]);
    expect(report.results[0].type).toBe("color");
    expect(report.results[0].status).toBe("warn");
  });

  it("detects 'bg' in name and audits contrast", () => {
    const token = makeToken({ name: "bg/surface", type: "other", values: { default: "#e8e8e8" } });
    const report = auditTokensForWcag([token]);
    expect(report.results[0].type).toBe("color");
    expect(report.results[0].status).toBe("fail");
  });

  it("detects 'fill' in name and audits contrast", () => {
    const token = makeToken({ name: "fill/brand", type: "other", values: { default: "#000000" } });
    const report = auditTokensForWcag([token]);
    expect(report.results[0].status).toBe("pass");
  });

  it("detects 'surface' in name", () => {
    const token = makeToken({ name: "surface/card", type: "other", values: { default: "#ffffff" } });
    const report = auditTokensForWcag([token]);
    expect(report.results[0].type).toBe("color");
  });

  it("detects 'brand' in name", () => {
    const token = makeToken({ name: "brand/cta", type: "other", values: { default: "#e8e8e8" } });
    const report = auditTokensForWcag([token]);
    expect(report.results[0].type).toBe("color");
    expect(report.results[0].status).toBe("fail");
  });
});

// ── auditTokensForWcag — spacing tokens ──────────────────────────

describe("auditTokensForWcag — spacing tokens", () => {
  it("returns warn for spacing value below 24px (px string)", () => {
    const report = auditTokensForWcag([spacingToken("spacing/xs", "8px")]);
    expect(report.results[0].status).toBe("warn");
    expect(report.results[0].wcagCriterion).toContain("2.5.8");
  });

  it("returns warn for spacing value below 24px (plain number)", () => {
    const report = auditTokensForWcag([spacingToken("spacing/sm", 16)]);
    expect(report.results[0].status).toBe("warn");
  });

  it("returns pass for spacing value exactly 24px", () => {
    const report = auditTokensForWcag([spacingToken("spacing/base", "24px")]);
    expect(report.results[0].status).toBe("pass");
  });

  it("returns pass for spacing value above 24px", () => {
    const report = auditTokensForWcag([spacingToken("spacing/lg", "48px")]);
    expect(report.results[0].status).toBe("pass");
  });

  it("returns pass for spacing value in rem that meets 24px", () => {
    // 1.5rem = 24px
    const report = auditTokensForWcag([spacingToken("spacing/touch", "1.5rem")]);
    expect(report.results[0].status).toBe("pass");
  });

  it("returns warn for spacing value in rem below 24px", () => {
    // 0.5rem = 8px
    const report = auditTokensForWcag([spacingToken("spacing/micro", "0.5rem")]);
    expect(report.results[0].status).toBe("warn");
  });
});

// ── auditTokensForWcag — summary counts ──────────────────────────

describe("auditTokensForWcag — summary counts", () => {
  it("summary.total matches results.length", () => {
    const tokens = [
      colorToken("color/a", "#000000"),
      colorToken("color/b", "#767676"),
      colorToken("color/c", "#e8e8e8"),
      spacingToken("spacing/xs", "8px"),
      makeToken({ name: "radius/sm", type: "radius", values: {} }),
    ];
    const report = auditTokensForWcag(tokens);
    expect(report.summary.total).toBe(report.results.length);
    expect(report.summary.total).toBe(5);
  });

  it("summary counts match individual result statuses", () => {
    const tokens = [
      colorToken("color/black", "#000000"),   // pass
      colorToken("color/mid", "#767676"),      // warn
      colorToken("color/light", "#e8e8e8"),    // fail
    ];
    const { summary, results } = auditTokensForWcag(tokens);
    const passCount = results.filter((r) => r.status === "pass").length;
    const warnCount = results.filter((r) => r.status === "warn").length;
    const failCount = results.filter((r) => r.status === "fail").length;
    expect(summary.pass).toBe(passCount);
    expect(summary.warn).toBe(warnCount);
    expect(summary.fail).toBe(failCount);
  });

  it("hasFailures is true when any token fails", () => {
    const tokens = [colorToken("color/bad", "#e8e8e8")];
    const report = auditTokensForWcag(tokens);
    expect(report.hasFailures).toBe(true);
  });

  it("hasFailures is false when no token fails", () => {
    const tokens = [
      colorToken("color/good", "#000000"),
      spacingToken("spacing/ok", "24px"),
    ];
    const report = auditTokensForWcag(tokens);
    expect(report.hasFailures).toBe(false);
  });

  it("returns empty report for empty token array", () => {
    const report = auditTokensForWcag([]);
    expect(report.results).toHaveLength(0);
    expect(report.summary.total).toBe(0);
    expect(report.hasFailures).toBe(false);
  });
});
