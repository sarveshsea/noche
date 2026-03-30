/**
 * Research Traceability — Bidirectional links between insights and specs.
 *
 * Maintains a reverse index: insight ID -> spec names[].
 * Updated on every spec save. Queryable for impact analysis.
 */

import { readFile, writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { createLogger } from "../engine/logger.js";
import type { AnySpec } from "../specs/types.js";
import type { ResearchInsight } from "./engine.js";

const log = createLogger("traceability");

export interface TraceabilityIndex {
  /** insight ID -> spec names that reference it */
  insightToSpecs: Record<string, string[]>;
  /** spec name -> insight IDs it references */
  specToInsights: Record<string, string[]>;
  updatedAt: string;
}

export class ResearchTraceability {
  private index: TraceabilityIndex = { insightToSpecs: {}, specToInsights: {}, updatedAt: "" };
  private indexPath: string;

  constructor(memoireDir: string) {
    this.indexPath = join(memoireDir, "research", "spec-index.json");
  }

  /** Load the traceability index from disk. */
  async load(): Promise<void> {
    try {
      const raw = await readFile(this.indexPath, "utf-8");
      this.index = JSON.parse(raw);
    } catch {
      this.index = { insightToSpecs: {}, specToInsights: {}, updatedAt: "" };
    }
  }

  /** Save the index to disk. */
  async save(): Promise<void> {
    this.index.updatedAt = new Date().toISOString();
    await mkdir(dirname(this.indexPath), { recursive: true });
    await writeFile(this.indexPath, JSON.stringify(this.index, null, 2));
  }

  /** Update the index when a spec is saved. */
  async onSpecSaved(spec: AnySpec): Promise<void> {
    const backing = "researchBacking" in spec ? (spec as { researchBacking: string[] }).researchBacking : [];
    if (!Array.isArray(backing)) return;

    // Remove old reverse entries for this spec
    const oldInsights = this.index.specToInsights[spec.name] ?? [];
    for (const insightId of oldInsights) {
      const specList = this.index.insightToSpecs[insightId];
      if (specList) {
        this.index.insightToSpecs[insightId] = specList.filter((s) => s !== spec.name);
        if (this.index.insightToSpecs[insightId].length === 0) {
          delete this.index.insightToSpecs[insightId];
        }
      }
    }

    // Add new entries
    this.index.specToInsights[spec.name] = backing;
    for (const insightId of backing) {
      if (!this.index.insightToSpecs[insightId]) {
        this.index.insightToSpecs[insightId] = [];
      }
      if (!this.index.insightToSpecs[insightId].includes(spec.name)) {
        this.index.insightToSpecs[insightId].push(spec.name);
      }
    }

    await this.save();
    log.debug({ spec: spec.name, insights: backing.length }, "Traceability index updated");
  }

  /** Remove a spec from the index. */
  async onSpecRemoved(specName: string): Promise<void> {
    const insightIds = this.index.specToInsights[specName] ?? [];
    for (const insightId of insightIds) {
      const specList = this.index.insightToSpecs[insightId];
      if (specList) {
        this.index.insightToSpecs[insightId] = specList.filter((s) => s !== specName);
        if (this.index.insightToSpecs[insightId].length === 0) {
          delete this.index.insightToSpecs[insightId];
        }
      }
    }
    delete this.index.specToInsights[specName];
    await this.save();
  }

  /** Get all specs that reference a given insight. */
  getSpecsForInsight(insightId: string): string[] {
    return this.index.insightToSpecs[insightId] ?? [];
  }

  /** Get all insights referenced by a spec. */
  getInsightsForSpec(specName: string): string[] {
    return this.index.specToInsights[specName] ?? [];
  }

  /** Get insights with no spec references (orphaned). */
  getOrphanedInsights(allInsights: ResearchInsight[]): ResearchInsight[] {
    return allInsights.filter((i) => !this.index.insightToSpecs[i.id] || this.index.insightToSpecs[i.id].length === 0);
  }

  /** Compute research coverage: % of specs with at least one insight. */
  getCoverage(specNames: string[]): { covered: number; total: number; ratio: number } {
    const covered = specNames.filter((name) => {
      const insights = this.index.specToInsights[name];
      return insights && insights.length > 0;
    }).length;
    return {
      covered,
      total: specNames.length,
      ratio: specNames.length > 0 ? covered / specNames.length : 1,
    };
  }

  /** Get the full index for serialization. */
  getIndex(): TraceabilityIndex {
    return this.index;
  }
}
