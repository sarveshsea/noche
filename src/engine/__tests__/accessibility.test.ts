import { describe, it, expect } from "vitest";
import {
  parseHex,
  relativeLuminance,
  contrastRatio,
  checkContrast,
  auditTokenContrast,
  auditTokenCompleteness,
  auditComponentSpec,
  auditPageSpec,
  runFullAudit,
} from "../accessibility.js";
import type { DesignToken, DesignSystem } from "../registry.js";
import type { ComponentSpec, PageSpec } from "../../specs/types.js";

describe("parseHex", () => {
  it("parses 6-digit hex", () => {
    expect(parseHex("#ff0000")).toEqual({ r: 255, g: 0, b: 0 });
    expect(parseHex("#000000")).toEqual({ r: 0, g: 0, b: 0 });
    expect(parseHex("#ffffff")).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("parses 3-digit hex", () => {
    expect(parseHex("#f00")).toEqual({ r: 255, g: 0, b: 0 });
    expect(parseHex("#fff")).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("parses 8-digit hex (ignores alpha)", () => {
    expect(parseHex("#ff0000ff")).toEqual({ r: 255, g: 0, b: 0 });
  });

  it("returns null for invalid hex", () => {
    expect(parseHex("not-a-color")).toBeNull();
    expect(parseHex("#zz")).toBeNull();
  });
});

describe("relativeLuminance", () => {
  it("black has luminance 0", () => {
    expect(relativeLuminance(0, 0, 0)).toBe(0);
  });

  it("white has luminance 1", () => {
    expect(relativeLuminance(255, 255, 255)).toBeCloseTo(1, 2);
  });
});

describe("contrastRatio", () => {
  it("black on white = 21:1", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });

  it("white on white = 1:1", () => {
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 0);
  });

  it("is symmetric", () => {
    const r1 = contrastRatio("#3b82f6", "#ffffff");
    const r2 = contrastRatio("#ffffff", "#3b82f6");
    expect(r1).toBeCloseTo(r2, 2);
  });
});

describe("checkContrast", () => {
  it("black on white passes all levels", () => {
    const result = checkContrast("#000000", "#ffffff");
    expect(result.passesAA).toBe(true);
    expect(result.passesAAA).toBe(true);
    expect(result.passesAALarge).toBe(true);
  });

  it("light gray on white fails AA", () => {
    const result = checkContrast("#aaaaaa", "#ffffff");
    expect(result.passesAA).toBe(false);
    expect(result.ratio).toBeLessThan(4.5);
  });

  it("medium gray on white passes large text AA", () => {
    const result = checkContrast("#767676", "#ffffff");
    expect(result.passesAALarge).toBe(true);
  });
});

describe("auditTokenContrast", () => {
  it("flags low contrast fg/bg pairs", () => {
    const tokens: DesignToken[] = [
      { name: "primary-foreground", collection: "colors", type: "color", values: { Light: "#cccccc" }, cssVariable: "--primary-foreground" },
      { name: "primary", collection: "colors", type: "color", values: { Light: "#ffffff" }, cssVariable: "--primary" },
    ];
    // primary-foreground on primary-background — but "primary" doesn't match background pattern
    // Let's use proper naming:
    const tokens2: DesignToken[] = [
      { name: "text", collection: "colors", type: "color", values: { Light: "#cccccc" }, cssVariable: "--text" },
      { name: "background", collection: "colors", type: "color", values: { Light: "#ffffff" }, cssVariable: "--bg" },
    ];
    const issues = auditTokenContrast(tokens2);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].rule).toBe("color-contrast");
  });

  it("passes high contrast pairs", () => {
    const tokens: DesignToken[] = [
      { name: "foreground", collection: "colors", type: "color", values: { Light: "#000000" }, cssVariable: "--fg" },
      { name: "background", collection: "colors", type: "color", values: { Light: "#ffffff" }, cssVariable: "--bg" },
    ];
    const issues = auditTokenContrast(tokens);
    expect(issues).toHaveLength(0);
  });
});

describe("auditTokenCompleteness", () => {
  it("flags missing focus ring token", () => {
    const tokens: DesignToken[] = [
      { name: "primary", collection: "colors", type: "color", values: { Light: "#000" }, cssVariable: "--primary" },
    ];
    const issues = auditTokenCompleteness(tokens);
    const focusIssue = issues.find((i) => i.message.includes("focus"));
    expect(focusIssue).toBeDefined();
  });

  it("passes when all semantic tokens exist", () => {
    const tokens: DesignToken[] = [
      { name: "focus-ring", collection: "colors", type: "color", values: { Light: "#3b82f6" }, cssVariable: "--focus" },
      { name: "destructive", collection: "colors", type: "color", values: { Light: "#ef4444" }, cssVariable: "--error" },
      { name: "disabled", collection: "colors", type: "color", values: { Light: "#9ca3af" }, cssVariable: "--disabled" },
    ];
    const issues = auditTokenCompleteness(tokens);
    expect(issues).toHaveLength(0);
  });
});

describe("auditComponentSpec", () => {
  const makeSpec = (overrides: Partial<ComponentSpec> = {}): ComponentSpec => ({
    name: "TestButton",
    type: "component",
    level: "atom",
    purpose: "Test button",
    researchBacking: [],
    designTokens: { source: "none", mapped: false },
    variants: ["default"],
    props: {},
    shadcnBase: ["Button"],
    composesSpecs: [],
    codeConnect: { props: {}, mapped: false },
    accessibility: { ariaLabel: "optional", keyboardNav: true },
    dataviz: null,
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  });

  it("flags missing ariaLabel", () => {
    const issues = auditComponentSpec(makeSpec({ accessibility: { ariaLabel: "none", keyboardNav: false } }));
    expect(issues.some((i) => i.rule === "missing-aria-label")).toBe(true);
  });

  it("flags missing keyboard nav on interactive components", () => {
    const issues = auditComponentSpec(makeSpec({ name: "DropdownMenu", accessibility: { ariaLabel: "optional", keyboardNav: false } }));
    expect(issues.some((i) => i.rule === "missing-keyboard-nav")).toBe(true);
  });

  it("passes well-configured specs", () => {
    const spec = makeSpec({
      accessibility: {
        ariaLabel: "Test button",
        keyboardNav: true,
        focusStyle: "ring",
        touchTarget: "44px",
      } as any,
    });
    const issues = auditComponentSpec(spec);
    const critical = issues.filter((i) => i.severity === "critical");
    expect(critical).toHaveLength(0);
  });
});

describe("auditPageSpec", () => {
  const makePageSpec = (a11y: Record<string, unknown> = {}): PageSpec => ({
    name: "TestPage",
    type: "page",
    purpose: "Test page",
    researchBacking: [],
    layout: "full-width",
    sections: [],
    shadcnLayout: [],
    responsive: { mobile: "stack", tablet: "grid-2", desktop: "grid-4" },
    meta: {},
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    accessibility: a11y,
  } as any);

  it("flags missing language, landmarks, skip link", () => {
    const issues = auditPageSpec(makePageSpec());
    expect(issues.some((i) => i.rule === "missing-language")).toBe(true);
    expect(issues.some((i) => i.rule === "missing-landmarks")).toBe(true);
    expect(issues.some((i) => i.rule === "missing-skip-link")).toBe(true);
  });

  it("passes fully configured page", () => {
    const issues = auditPageSpec(makePageSpec({
      language: "en",
      landmarks: true,
      skipLink: true,
      headingHierarchy: true,
    }));
    expect(issues).toHaveLength(0);
  });
});

describe("runFullAudit", () => {
  it("produces a complete report", () => {
    const ds: DesignSystem = {
      tokens: [
        { name: "foreground", collection: "c", type: "color", values: { Light: "#000" }, cssVariable: "--fg" },
        { name: "background", collection: "c", type: "color", values: { Light: "#fff" }, cssVariable: "--bg" },
        { name: "focus-ring", collection: "c", type: "color", values: { Light: "#00f" }, cssVariable: "--focus" },
        { name: "destructive", collection: "c", type: "color", values: { Light: "#f00" }, cssVariable: "--error" },
        { name: "disabled", collection: "c", type: "color", values: { Light: "#999" }, cssVariable: "--disabled" },
      ],
      components: [],
      styles: [],
      lastSync: new Date().toISOString(),
    };

    const report = runFullAudit(ds, []);
    expect(report.score).toBeGreaterThan(0);
    expect(report.score).toBeLessThanOrEqual(100);
    expect(report.level).toBeDefined();
  });
});
