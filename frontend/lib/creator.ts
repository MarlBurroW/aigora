/**
 * "Creator" derives the actual MODEL CREATOR from a (provider, model_id)
 * pair, regardless of whether the request went through that creator's own
 * SDK or through the OpenRouter gateway.
 *
 * The DB keeps `provider` as the API surface that produced the run
 * (openai / anthropic / gemini / openrouter) — important for reproducibility.
 * Display surfaces (cards, profiles, icons, tabs) use `creator` instead, so
 * a Mistral model tested via OpenRouter shows up as Mistral, not OpenRouter.
 */

import type { Provider } from "./types";

export type Creator =
  | "openai"
  | "anthropic"
  | "google"
  | "mistral"
  | "meta"
  | "deepseek"
  | "qwen"
  | "cohere"
  | "xai"
  | "microsoft"
  | "nvidia"
  | "perplexity"
  | "amazon"
  | "alibaba"
  | "ai21"
  | "baidu"
  | "bytedance"
  | "moonshot"
  | "minimax"
  | "zai"
  | "ai2"
  | "ibm"
  | "inflection"
  | "tencent"
  | "arcee"
  | "aionlabs"
  | "nousresearch"
  | "deepcogito"
  | "liquid"
  | "morph"
  | "essentialai"
  | "primeintellect"
  | "inception"
  | "kimi"
  | "kwaipilot"
  | "openrouter"; // catch-all fallback

/**
 * Maps the OpenRouter `<creator>/<model>` prefix (lower-case) to our
 * canonical creator key. Anything not matched falls back to "openrouter".
 */
const PREFIX_TO_CREATOR: Record<string, Creator> = {
  // big-3 (would normally be tested natively, but OpenRouter exposes
  // them too; if they ever sneak through we still attribute correctly)
  "openai": "openai",
  "anthropic": "anthropic",
  "google": "google",

  // open-source heavyweights
  "mistralai": "mistral",
  "meta-llama": "meta",
  "deepseek": "deepseek",
  "qwen": "qwen",
  "cohere": "cohere",

  // big-tech labs
  "x-ai": "xai",
  "microsoft": "microsoft",
  "nvidia": "nvidia",
  "perplexity": "perplexity",
  "amazon": "amazon",
  "alibaba": "alibaba",
  "ai21": "ai21",
  "baidu": "baidu",
  "bytedance": "bytedance",
  "bytedance-seed": "bytedance",
  "tencent": "tencent",
  "ibm-granite": "ibm",
  "inflection": "inflection",

  // chinese second wave
  "moonshotai": "moonshot",
  "minimax": "minimax",
  "z-ai": "zai",
  "zhipu": "zai",
  "kimi": "kimi",
  "kwaipilot": "kwaipilot",

  // research labs / smaller players
  "allenai": "ai2",
  "arcee-ai": "arcee",
  "aion-labs": "aionlabs",
  "nousresearch": "nousresearch",
  "deepcogito": "deepcogito",
  "liquid": "liquid",
  "morph": "morph",
  "essentialai": "essentialai",
  "prime-intellect": "primeintellect",
  "inception": "inception",
};

export function getCreator(provider: Provider, modelId: string): Creator {
  if (provider === "openai") return "openai";
  if (provider === "anthropic") return "anthropic";
  if (provider === "gemini") return "google";
  if (provider === "xai") return "xai";
  if (provider === "openrouter") {
    const prefix = modelId.split("/", 1)[0]?.toLowerCase() ?? "";
    return PREFIX_TO_CREATOR[prefix] ?? "openrouter";
  }
  return "openrouter";
}

export const CREATOR_LABEL: Record<Creator, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google",
  mistral: "Mistral",
  meta: "Meta",
  deepseek: "DeepSeek",
  qwen: "Qwen",
  cohere: "Cohere",
  xai: "xAI",
  microsoft: "Microsoft",
  nvidia: "NVIDIA",
  perplexity: "Perplexity",
  amazon: "Amazon",
  alibaba: "Alibaba",
  ai21: "AI21",
  baidu: "Baidu",
  bytedance: "ByteDance",
  moonshot: "Moonshot",
  minimax: "MiniMax",
  zai: "Z.ai",
  ai2: "Allen AI",
  ibm: "IBM",
  inflection: "Inflection",
  tencent: "Tencent",
  arcee: "Arcee AI",
  aionlabs: "Aion Labs",
  nousresearch: "Nous Research",
  deepcogito: "DeepCogito",
  liquid: "Liquid AI",
  morph: "Morph",
  essentialai: "Essential AI",
  primeintellect: "Prime Intellect",
  inception: "Inception",
  kimi: "Kimi",
  kwaipilot: "KwaiPilot",
  openrouter: "OpenRouter",
};

/** Strip the `<creator>/` prefix from an OpenRouter model id for display.
 *  e.g. `mistralai/mistral-large-latest` → `mistral-large-latest`. */
export function shortModelName(provider: Provider, modelId: string): string {
  if (provider !== "openrouter") return modelId;
  const i = modelId.indexOf("/");
  return i >= 0 ? modelId.slice(i + 1) : modelId;
}
