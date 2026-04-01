import { afterEach, describe, expect, it, vi } from "vitest";
import { Command } from "commander";
import { registerIACommand } from "../ia.js";
import { captureLogs, lastLog } from "./test-helpers.js";

afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = 0;
});

describe("ia --json", () => {
  it("emits structured inventory for ia list --json", async () => {
    const logs = captureLogs();
    const program = new Command();

    registerIACommand(program, makeIAEngine() as never);
    await program.parseAsync(["ia", "list", "--json"], { from: "user" });

    const payload = JSON.parse(lastLog(logs));
    expect(payload.status).toBe("completed");
    expect(payload.summary).toMatchObject({
      total: 1,
      pages: 2,
      nodes: 3,
      flows: 1,
    });
    expect(payload.specs).toEqual([
      {
        name: "SiteMap",
        pages: 2,
        nodes: 3,
        flows: 1,
        entryPoints: 1,
        sourceFileKey: "figma-file-key",
      },
    ]);
  });

  it("emits structured tree data for ia show --json", async () => {
    const logs = captureLogs();
    const program = new Command();

    registerIACommand(program, makeIAEngine() as never);
    await program.parseAsync(["ia", "show", "SiteMap", "--json"], { from: "user" });

    const payload = JSON.parse(lastLog(logs));
    expect(payload.status).toBe("completed");
    expect(payload.requestedName).toBe("SiteMap");
    expect(payload.spec).toMatchObject({
      name: "SiteMap",
      nodeCount: 3,
      pages: 2,
      sourceFileKey: "figma-file-key",
      entryPoints: ["root"],
    });
    expect(payload.spec.root.label).toBe("Root");
    expect(payload.spec.flows).toHaveLength(1);
  });

  it("emits validation warnings for ia validate --json", async () => {
    const logs = captureLogs();
    const program = new Command();

    registerIACommand(program, makeIAEngine({
      root: {
        id: "root",
        label: "Root",
        type: "page",
        linkedPageSpec: "MissingPage",
        children: [],
      },
      flows: [],
      entryPoints: [],
      globals: [{ id: "global-nav", label: "Global", type: "global-nav", linkedPageSpec: "MissingGlobal", children: [] }],
    }) as never);
    await program.parseAsync(["ia", "validate", "SiteMap", "--json"], { from: "user" });

    const payload = JSON.parse(lastLog(logs));
    expect(payload.status).toBe("completed");
    expect(payload.summary.checked).toBe(1);
    expect(payload.summary.warnings).toBeGreaterThan(0);
    expect(payload.summary.valid).toBe(1);
    expect(payload.specs[0].warnings.some((warning: { path: string; message: string }) =>
      warning.path === "flows" || warning.message.includes("Page spec"))).toBe(true);
  });
});

function makeIAEngine(overrides?: Partial<{
  root: unknown;
  flows: unknown[];
  entryPoints: string[];
  globals: unknown[];
}>) {
  const iaSpec = {
    name: "SiteMap",
    type: "ia",
    purpose: "Primary site architecture",
    sourceFileKey: "figma-file-key",
    root: overrides?.root ?? {
      id: "root",
      label: "Root",
      type: "page",
      children: [
        {
          id: "home",
          label: "Home",
          type: "page",
          linkedPageSpec: "HomePage",
          children: [],
        },
        {
          id: "settings",
          label: "Settings",
          type: "page",
          linkedPageSpec: "SettingsPage",
          children: [],
        },
      ],
    },
    flows: overrides?.flows ?? [
      {
        from: "home",
        to: "settings",
        trigger: "click",
        label: "Open settings",
      },
    ],
    entryPoints: overrides?.entryPoints ?? ["root"],
    globals: overrides?.globals ?? [],
    notes: [],
    tags: [],
    createdAt: "2026-03-27T12:00:00.000Z",
    updatedAt: "2026-03-27T12:00:00.000Z",
  };

  const specs = [
    iaSpec,
    { name: "HomePage", type: "page" },
    { name: "SettingsPage", type: "page" },
  ];

  return {
    async init() {},
    registry: {
      async getAllSpecs() {
        return specs;
      },
      async getSpec(name: string) {
        return specs.find((spec) => spec.name === name) ?? null;
      },
      async saveSpec() {},
    },
  };
}
