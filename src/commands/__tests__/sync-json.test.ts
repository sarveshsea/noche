import { afterEach, describe, expect, it, vi } from "vitest";
import { Command } from "commander";
import { registerSyncCommand } from "../sync.js";
import { captureLogs } from "./test-helpers.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("sync --json", () => {
  it("emits structured payload with figma connected", async () => {
    const logs = captureLogs();
    const engine = makeSyncEngine({ figmaConnected: true });
    const program = new Command();

    registerSyncCommand(program, engine as never);
    await program.parseAsync(["sync", "--json"], { from: "user" });

    const payload = JSON.parse(logs.at(-1)!);

    expect(payload.status).toBe("completed");
    expect(payload.figma.connected).toBe(true);
    expect(payload.figma.cached).toBe(false);
    expect(payload.designSystem.tokens).toBe(3);
    expect(payload.designSystem.components).toBe(2);
    expect(payload.specs.total).toBe(2);
    expect(typeof payload.elapsedMs).toBe("number");
  });

  it("emits partial status when figma unavailable", async () => {
    const logs = captureLogs();
    const engine = makeSyncEngine({ figmaConnected: false });
    const program = new Command();

    registerSyncCommand(program, engine as never);
    await program.parseAsync(["sync", "--json"], { from: "user" });

    const payload = JSON.parse(logs.at(-1)!);

    expect(payload.status).toBe("partial");
    expect(payload.figma.connected).toBe(false);
    expect(payload.figma.cached).toBe(true);
    expect(payload.figma.error).toBeDefined();
  });

  it("suppresses text output in json mode", async () => {
    const logs = captureLogs();
    const engine = makeSyncEngine({ figmaConnected: true });
    const program = new Command();

    registerSyncCommand(program, engine as never);
    await program.parseAsync(["sync", "--json"], { from: "user" });

    // Only the JSON payload should be logged, no "Starting full sync" etc.
    expect(logs).toHaveLength(1);
    expect(() => JSON.parse(logs[0])).not.toThrow();
  });
});

function makeSyncEngine({ figmaConnected }: { figmaConnected: boolean }) {
  const ds = {
    tokens: [{ name: "a" }, { name: "b" }, { name: "c" }],
    components: [{ name: "Button" }, { name: "Card" }],
    styles: [{ name: "fill/primary" }],
    lastSync: "2026-03-28T00:00:00.000Z",
  };

  return {
    async init() {},
    async ensureFigmaConnected() {
      if (!figmaConnected) throw new Error("Figma not available");
    },
    figma: {
      get isConnected() { return figmaConnected; },
    },
    async pullDesignSystem() {},
    async fullSync() {},
    async generateFromSpec() {},
    registry: {
      designSystem: ds,
      async getAllSpecs() {
        return [
          { type: "component", name: "Button" },
          { type: "page", name: "Dashboard" },
        ];
      },
    },
  };
}
