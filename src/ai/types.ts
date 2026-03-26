/**
 * AI Module Types — Shared types for Anthropic SDK integration.
 */

export interface AIResponse {
  content: string;
  model: string;
  usage: TokenUsage;
  stopReason: string;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheCreationTokens?: number;
}

export type ModelTier = "fast" | "deep";

export interface AICompletionOptions {
  system: string;
  messages: AIMessage[];
  model?: ModelTier;
  maxTokens?: number;
  temperature?: number;
}

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}
