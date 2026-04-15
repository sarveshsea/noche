// Typed job lifecycle. Replaces the per-module `state.activeRunId` +
// `state.jobs` pair in main/index.ts with a self-contained store that:
//
// - uses UUIDv4 for runId so job ids cannot collide under load (#19)
// - tracks the active run as a stack so nested/interleaved commands stop
//   mis-attributing document-change events (#17, N5)
// - accepts structured WidgetError for failures instead of bare strings
//   (#32, #33, #35)

import type { WidgetJob, WidgetJobStatus, WidgetCommandName } from "../../shared/contracts.js";
import type { WidgetError } from "../../shared/errors.js";
import { uuidv4 } from "../../shared/ids.js";

export interface JobsStore {
  start(params: {
    id: string;
    command: WidgetCommandName;
    kind: WidgetJob["kind"];
    label: string;
  }): WidgetJob;
  finishCompleted(jobId: string, summary?: string): WidgetJob | null;
  finishFailed(jobId: string, error: WidgetError | string): WidgetJob | null;
  markDisconnected(jobId: string): WidgetJob | null;
  get(jobId: string): WidgetJob | undefined;
  all(): WidgetJob[];
  activeRunId(): string | null;
  size(): number;
}

export interface JobsStoreOptions {
  onEmit?: (job: WidgetJob) => void;
  now?: () => number;
}

export function createJobsStore(options: JobsStoreOptions = {}): JobsStore {
  const jobs = new Map<string, WidgetJob>();
  // Stack of active runIds. The top of the stack is the attribution target
  // for document-change events. Using a stack rather than a scalar means that
  // if command A starts, command B starts, B finishes, changes arriving before
  // A finishes are correctly attributed to A.
  const runStack: string[] = [];
  const emit = options.onEmit ?? (() => {});
  const now = options.now ?? (() => Date.now());

  function put(job: WidgetJob): WidgetJob {
    jobs.set(job.id, job);
    emit(job);
    return job;
  }

  function errorToString(error: WidgetError | string): string {
    if (typeof error === "string") return error;
    // Preserve structure on the wire via the job.error field. We keep the
    // existing string-typed contract; downstream consumers can parse JSON
    // when the payload starts with '{'. This stays backwards-compatible
    // until the schema upgrade in Phase 6.
    try {
      return JSON.stringify({
        code: error.code,
        message: error.message,
        retryable: error.retryable,
        detail: error.detail,
      });
    } catch {
      return error.message;
    }
  }

  return {
    start({ id, command, kind, label }) {
      const t = now();
      const runId = uuidv4();
      const job: WidgetJob = {
        id,
        runId,
        kind,
        label,
        command,
        status: "running",
        startedAt: t,
        updatedAt: t,
        progressText: "Running",
      };
      runStack.push(runId);
      return put(job);
    },

    finishCompleted(jobId, summary) {
      const existing = jobs.get(jobId);
      if (!existing) return null;
      const t = now();
      const next: WidgetJob = {
        ...existing,
        status: "completed",
        updatedAt: t,
        finishedAt: t,
        progressText: "Done",
        summary,
        error: undefined,
      };
      popRun(existing.runId);
      return put(next);
    },

    finishFailed(jobId, error) {
      const existing = jobs.get(jobId);
      if (!existing) return null;
      const t = now();
      const next: WidgetJob = {
        ...existing,
        status: "failed",
        updatedAt: t,
        finishedAt: t,
        progressText: "Failed",
        error: errorToString(error),
      };
      popRun(existing.runId);
      return put(next);
    },

    markDisconnected(jobId) {
      const existing = jobs.get(jobId);
      if (!existing) return null;
      if (existing.status !== "running") return existing;
      const t = now();
      const next: WidgetJob = {
        ...existing,
        status: "disconnected",
        updatedAt: t,
        finishedAt: t,
        progressText: "Disconnected",
      };
      popRun(existing.runId);
      return put(next);
    },

    get(jobId) {
      return jobs.get(jobId);
    },

    all() {
      return Array.from(jobs.values());
    },

    activeRunId() {
      return runStack.length > 0 ? runStack[runStack.length - 1] : null;
    },

    size() {
      return jobs.size;
    },
  };

  function popRun(runId: string): void {
    const idx = runStack.lastIndexOf(runId);
    if (idx >= 0) runStack.splice(idx, 1);
  }
}

// Guard-rail helper: run an async handler with guaranteed finish-or-fail
// lifecycle regardless of thrown errors or early returns.
export async function runJob<T>(
  store: JobsStore,
  params: Parameters<JobsStore["start"]>[0],
  fn: () => Promise<T>,
): Promise<{ job: WidgetJob; result?: T; error?: WidgetError | string }> {
  const job = store.start(params);
  try {
    const result = await fn();
    store.finishCompleted(job.id);
    return { job, result };
  } catch (error) {
    const err = error as WidgetError | Error | string;
    const normalized: WidgetError | string =
      typeof err === "string"
        ? err
        : err instanceof Error
          ? err.message
          : err;
    store.finishFailed(job.id, normalized);
    return { job, error: normalized };
  }
}
