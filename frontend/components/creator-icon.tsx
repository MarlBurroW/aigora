import {
  Ai21,
  AionLabs,
  Alibaba,
  Anthropic,
  Arcee,
  Baidu,
  ByteDance,
  Cohere,
  DeepCogito,
  DeepSeek,
  Gemini,
  Grok,
  Inception,
  Kimi,
  Meta,
  Microsoft,
  Minimax,
  Mistral,
  Moonshot,
  NousResearch,
  Nvidia,
  OpenAI,
  OpenRouter,
  Perplexity,
  Qwen,
  Tencent,
  XAI,
  ZAI,
} from "@lobehub/icons";
import type { Creator } from "@/lib/creator";

// Each lobe-icon has its own nominal type — flatten them to `any` so the
// map is uniform. At runtime they all expose the same call signature plus
// `.Avatar`, `.Combine`, etc.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyIcon = any;

const ICONS: Record<Creator, AnyIcon> = {
  openai: OpenAI,
  anthropic: Anthropic,
  google: Gemini,
  mistral: Mistral,
  meta: Meta,
  deepseek: DeepSeek,
  qwen: Qwen,
  cohere: Cohere,
  xai: XAI ?? Grok,
  microsoft: Microsoft,
  nvidia: Nvidia,
  perplexity: Perplexity,
  amazon: OpenRouter, // no specific lobe icon for Amazon Nova — fall back
  alibaba: Alibaba,
  ai21: Ai21,
  baidu: Baidu,
  bytedance: ByteDance,
  moonshot: Moonshot,
  minimax: Minimax,
  zai: ZAI,
  ai2: OpenRouter, // no Allen-AI icon
  ibm: OpenRouter,
  inflection: OpenRouter,
  tencent: Tencent,
  arcee: Arcee,
  aionlabs: AionLabs,
  nousresearch: NousResearch,
  deepcogito: DeepCogito,
  liquid: OpenRouter,
  morph: OpenRouter,
  essentialai: OpenRouter,
  primeintellect: OpenRouter,
  inception: Inception,
  kimi: Kimi,
  kwaipilot: OpenRouter,
  openrouter: OpenRouter,
};

type Props = {
  creator: Creator;
  size?: number;
  variant?: "mono" | "avatar";
  className?: string;
};

export function CreatorIcon({
  creator,
  size = 20,
  variant = "mono",
  className,
}: Props) {
  const Icon = ICONS[creator] ?? OpenRouter;
  if (variant === "avatar" && Icon.Avatar) {
    return <Icon.Avatar size={size} className={className} />;
  }
  return <Icon size={size} className={className} />;
}
