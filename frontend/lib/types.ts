export type Provider =
  | "openai"
  | "anthropic"
  | "gemini"
  | "xai"
  | "openrouter";

export type AnswerLabel =
  | "strongly_agree"
  | "agree"
  | "neutral"
  | "disagree"
  | "strongly_disagree"
  | "no_opinion";

export type ModelSummary = {
  provider: Provider;
  modelId: string;
  latestRunId: number;
  latestRunStartedAt: Date;
  totalRuns: number;
  totalTokens: number;
  hasError: boolean;
};

export type RunHeader = {
  id: number;
  provider: Provider;
  modelId: string;
  startedAt: Date;
  finishedAt: Date;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  finishReason: string | null;
  error: string | null;
};

export type AxisScore = {
  axis: string;
  score: number;
};

export type AnswerRow = {
  questionId: string;
  response: AnswerLabel;
};

export type RunDetails = RunHeader & {
  scores: AxisScore[];
  answers: AnswerRow[];
};

// Re-export so consumers don't have to reach into politiscales.ts
export type { QualityAssessment, QualityFlag } from "./politiscales";
