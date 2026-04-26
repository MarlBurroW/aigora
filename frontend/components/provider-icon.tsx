import { Anthropic, Gemini, OpenAI, OpenRouter } from "@lobehub/icons";
import type { Provider } from "@/lib/types";

// Each lobe-icon exports its own `CompoundedIcon` shape (different module,
// nominally distinct in TS even though their runtime APIs match), so we
// erase the type here. Calls to `Icon(...)` and `Icon.Avatar(...)` work fine
// because every icon in the map exposes both.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { XAI } from "@lobehub/icons";

const ICONS: Record<Provider, any> = {
  openai: OpenAI,
  anthropic: Anthropic,
  gemini: Gemini,
  xai: XAI,
  openrouter: OpenRouter,
};

type Props = {
  provider: Provider;
  size?: number;
  variant?: "mono" | "avatar";
  className?: string;
};

export function ProviderIcon({
  provider,
  size = 20,
  variant = "mono",
  className,
}: Props) {
  const Icon = ICONS[provider] ?? OpenAI;
  if (variant === "avatar") {
    return <Icon.Avatar size={size} className={className} />;
  }
  return <Icon size={size} className={className} />;
}
