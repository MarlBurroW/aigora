import type { AnswerLabel, Provider } from "./types";

export const PROVIDER_LABEL: Record<Provider, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  gemini: "Google",
  xai: "xAI",
  openrouter: "OpenRouter",
};

export const ANSWER_LABEL: Record<AnswerLabel, string> = {
  strongly_agree: "Strongly agree",
  agree: "Agree",
  neutral: "Neutral",
  disagree: "Disagree",
  strongly_disagree: "Strongly disagree",
  no_opinion: "No opinion",
};

export const ANSWER_COLOR: Record<AnswerLabel, string> = {
  strongly_agree: "text-emerald-300",
  agree: "text-emerald-200/80",
  neutral: "text-zinc-400",
  disagree: "text-rose-200/80",
  strongly_disagree: "text-rose-300",
  no_opinion: "text-amber-200 italic",
};

export const ANSWER_VALUE: Record<AnswerLabel, number | null> = {
  strongly_agree: 1,
  agree: 2 / 3,
  neutral: 0,
  disagree: -2 / 3,
  strongly_disagree: -1,
  no_opinion: null,
};

export function modelHref(provider: string, modelId: string): string {
  return `/models/${provider}/${encodeURIComponent(modelId)}`;
}

export function formatTokens(n: number): string {
  if (n < 1000) return `${n}`;
  return `${(n / 1000).toFixed(1)}k`;
}

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  // Force UTC so server-side and client-side renders agree (avoids hydration
  // warnings when the deploy's timezone differs from the user's).
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** Compact "Apr 26" form used in dense lists (cards, table rows). */
export function formatDateShort(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** ISO yyyy-mm-dd, used as the machine-readable `datetime` attribute on
 * <time> elements so hover tooltips show the precise date. */
export function formatDateISO(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}
