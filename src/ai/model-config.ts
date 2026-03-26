/**
 * Model Configuration — Maps tiers to model IDs and limits.
 */

import type { ModelTier } from "./types.js";

export interface ModelConfig {
  id: string;
  maxOutput: number;
  contextWindow: number;
  costPer1kInput: number;
  costPer1kOutput: number;
}

const MODELS: Record<ModelTier, ModelConfig> = {
  fast: {
    id: "claude-sonnet-4-20250514",
    maxOutput: 16384,
    contextWindow: 200000,
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
  },
  deep: {
    id: "claude-sonnet-4-20250514",
    maxOutput: 16384,
    contextWindow: 200000,
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
  },
};

export function getModelConfig(tier: ModelTier): ModelConfig {
  return MODELS[tier];
}

export function getModelId(tier: ModelTier): string {
  return MODELS[tier].id;
}

export function getMaxOutput(tier: ModelTier): number {
  return MODELS[tier].maxOutput;
}

export function estimateCost(usage: { inputTokens: number; outputTokens: number }, tier: ModelTier): number {
  const config = MODELS[tier];
  return (usage.inputTokens / 1000) * config.costPer1kInput + (usage.outputTokens / 1000) * config.costPer1kOutput;
}
