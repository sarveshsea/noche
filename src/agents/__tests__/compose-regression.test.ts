import { mkdir, rm, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { MemoireEngine } from "../../engine/core.js";
import { AgentOrchestrator } from "../orchestrator.js";
import type { ComponentSpec, DataVizSpec, PageSpec } from "../../specs/types.js";

vi.mock("../../ai/index.js", () => ({
  getAI: () => null,
  hasAI: () => false,
  getTracker: () => null,
}));

type TargetSpec = ComponentSpec | PageSpec | DataVizSpec;

describe("compose regression", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `memoire-compose-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await mkdir(testDir, { recursive: true });
    await writeFile(join(testDir, "package.json"), JSON.stringify({ name: "compose-regression" }, null, 2));
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it.each([
    {
      intent: "create a login page with email and password fields",
      target: makePageSpec("LoginPage"),
      distractors: [makeComponentSpec("UserCard"), makeDataVizSpec("ActivityChart")],
      expectedCategory: "page-layout",
    },
    {
      intent: "create a login form component with email and password inputs",
      target: makeComponentSpec("LoginForm"),
      distractors: [makePageSpec("Dashboard"), makeDataVizSpec("ActivityChart")],
      expectedCategory: "component-create",
    },
    {
      intent: "create a sales chart dataviz for monthly revenue trends",
      target: makeDataVizSpec("SalesChart"),
      distractors: [makePageSpec("Dashboard"), makeComponentSpec("UserCard")],
      expectedCategory: "dataviz-create",
    },
  ])("targets only the resolved $expectedCategory spec for $intent", async ({ intent, target, distractors }) => {
    const engine = new MemoireEngine({ projectRoot: testDir });
    await engine.init();

    await engine.registry.saveSpec(target);
    for (const spec of distractors) {
      await engine.registry.saveSpec(spec);
    }

    const generated: string[] = [];
    vi.spyOn(engine, "generateFromSpec").mockImplementation(async (specName: string) => {
      generated.push(specName);
      return join("generated", specName, `${specName}.tsx`);
    });

    const orchestrator = new AgentOrchestrator(engine);
    await orchestrator.execute(intent);

    expect(generated).toEqual([target.name]);
  });
});

function makeComponentSpec(name: string): ComponentSpec {
  return {
    name,
    type: "component",
    level: "atom",
    purpose: `${name} component`,
    researchBacking: [],
    designTokens: { source: "none", mapped: false },
    variants: ["default"],
    props: { label: "string" },
    shadcnBase: ["Card"],
    composesSpecs: [],
    codeConnect: { props: {}, mapped: false },
    accessibility: { ariaLabel: "optional", keyboardNav: false },
    dataviz: null,
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function makePageSpec(name: string): PageSpec {
  return {
    name,
    type: "page",
    purpose: `${name} page`,
    researchBacking: [],
    layout: "full-width",
    sections: [],
    shadcnLayout: [],
    responsive: { mobile: "stack", tablet: "grid-2", desktop: "grid-4" },
    meta: {},
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function makeDataVizSpec(name: string): DataVizSpec {
  return {
    name,
    type: "dataviz",
    purpose: `${name} chart`,
    chartType: "line",
    library: "recharts",
    dataShape: { x: "date", y: "value" },
    interactions: ["hover-tooltip"],
    accessibility: { altText: "required", keyboardNav: true, dataTableFallback: true },
    responsive: {
      mobile: { height: 200, simplify: true },
      desktop: { height: 400 },
    },
    shadcnWrapper: "Card",
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
