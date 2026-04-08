/**
 * Agent system — re-exports for clean imports.
 *
 * Extracted modules available for independent use:
 *   - classifyIntent / INTENT_PATTERNS  →  src/agents/intent-classifier.ts
 *   - PlanBuilder                       →  src/agents/plan-builder.ts
 *   - SubAgentRunner                    →  src/agents/sub-agents.ts
 */

export { AgentOrchestrator, classifyIntent } from "./orchestrator.js";
export type {
  IntentCategory,
  AgentPlan,
  SubTask,
  SubAgentType,
  AgentContext,
  AgentExecutionResult,
  DesignMutation,
} from "./orchestrator.js";

// Direct exports from extracted modules for independent use
export { INTENT_PATTERNS } from "./intent-classifier.js";
export type { IntentCategory as IntentClass } from "./intent-classifier.js";
export { PlanBuilder } from "./plan-builder.js";

export { AGENT_PROMPTS } from "./prompts.js";
