import { describe, expect, it, vi } from "vitest";
import { createJobsStore, runJob } from "../main/state/jobs.js";
import { isUuidV4 } from "../shared/ids.js";
import { makeError } from "../shared/errors.js";
import type { WidgetJob } from "../shared/contracts.js";

function startParams(id: string): Parameters<ReturnType<typeof createJobsStore>["start"]>[0] {
  return { id, command: "getSelection", kind: "selection", label: "Inspect" };
}

describe("createJobsStore", () => {
  it("assigns UUIDv4 runIds", () => {
    const store = createJobsStore();
    const job = store.start(startParams("req-1"));
    expect(isUuidV4(job.runId)).toBe(true);
  });

  it("emits on start and finish", () => {
    const events: WidgetJob[] = [];
    const store = createJobsStore({ onEmit: (j) => events.push(j) });
    const job = store.start(startParams("req-1"));
    store.finishCompleted(job.id, "ok");
    expect(events).toHaveLength(2);
    expect(events[0].status).toBe("running");
    expect(events[1].status).toBe("completed");
  });

  it("active runId tracks a stack so nested commands attribute correctly", () => {
    const store = createJobsStore();
    expect(store.activeRunId()).toBeNull();
    const a = store.start(startParams("a"));
    expect(store.activeRunId()).toBe(a.runId);
    const b = store.start(startParams("b"));
    expect(store.activeRunId()).toBe(b.runId);
    store.finishCompleted(b.id);
    expect(store.activeRunId()).toBe(a.runId);
    store.finishCompleted(a.id);
    expect(store.activeRunId()).toBeNull();
  });

  it("pops the correct runId even when jobs finish out of order", () => {
    const store = createJobsStore();
    const a = store.start(startParams("a"));
    const b = store.start(startParams("b"));
    store.finishCompleted(a.id);
    expect(store.activeRunId()).toBe(b.runId);
    store.finishCompleted(b.id);
    expect(store.activeRunId()).toBeNull();
  });

  it("finishFailed serializes WidgetError into job.error JSON string", () => {
    const store = createJobsStore();
    const job = store.start(startParams("a"));
    const widgetErr = makeError("E_TIMEOUT", "slow", { detail: { ms: 5000 } });
    const finished = store.finishFailed(job.id, widgetErr);
    expect(finished?.status).toBe("failed");
    const parsed = JSON.parse(finished!.error!);
    expect(parsed.code).toBe("E_TIMEOUT");
    expect(parsed.detail).toEqual({ ms: 5000 });
    expect(parsed.retryable).toBe(true);
  });

  it("finishFailed accepts a plain string", () => {
    const store = createJobsStore();
    const job = store.start(startParams("a"));
    const finished = store.finishFailed(job.id, "oops");
    expect(finished?.error).toBe("oops");
  });

  it("markDisconnected is idempotent for non-running jobs", () => {
    const store = createJobsStore();
    const job = store.start(startParams("a"));
    store.finishCompleted(job.id);
    const again = store.markDisconnected(job.id);
    expect(again?.status).toBe("completed");
  });

  it("returns null when finishing unknown job", () => {
    const store = createJobsStore();
    expect(store.finishCompleted("nope")).toBeNull();
    expect(store.finishFailed("nope", "x")).toBeNull();
    expect(store.markDisconnected("nope")).toBeNull();
  });

  it("all() returns all registered jobs", () => {
    const store = createJobsStore();
    store.start(startParams("a"));
    store.start(startParams("b"));
    expect(store.all()).toHaveLength(2);
    expect(store.size()).toBe(2);
  });
});

describe("runJob", () => {
  it("resolves and marks completed", async () => {
    const store = createJobsStore();
    const { job, result, error } = await runJob(store, startParams("a"), async () => 42);
    expect(result).toBe(42);
    expect(error).toBeUndefined();
    expect(store.get(job.id)?.status).toBe("completed");
    expect(store.activeRunId()).toBeNull();
  });

  it("rejects and marks failed, clearing active run", async () => {
    const store = createJobsStore();
    const { job, error } = await runJob(store, startParams("a"), async () => {
      throw new Error("boom");
    });
    expect(error).toBe("boom");
    expect(store.get(job.id)?.status).toBe("failed");
    expect(store.activeRunId()).toBeNull();
  });

  it("clears active run even when handler throws synchronously inside async", async () => {
    const store = createJobsStore();
    await runJob(store, startParams("a"), async () => {
      throw new Error("sync-ish");
    });
    expect(store.activeRunId()).toBeNull();
  });

  it("handles two concurrent runs without state bleed", async () => {
    const store = createJobsStore();
    const gateA = defer<number>();
    const gateB = defer<number>();
    const a = runJob(store, startParams("a"), () => gateA.promise);
    const b = runJob(store, startParams("b"), () => gateB.promise);
    // b was started last, it is the active attribution target
    expect(store.activeRunId()).not.toBeNull();
    gateB.resolve(2);
    await b;
    // After b finishes, attribution falls back to a
    expect(store.activeRunId()).not.toBeNull();
    gateA.resolve(1);
    await a;
    expect(store.activeRunId()).toBeNull();
  });
});

function defer<T>(): { promise: Promise<T>; resolve: (v: T) => void } {
  let resolveFn!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolveFn = r));
  return { promise, resolve: resolveFn };
}
