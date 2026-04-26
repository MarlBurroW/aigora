/**
 * Stable color assignment per (provider, modelId).
 *
 * Deliberately excludes red and blue from the palette because those are
 * already used by the left/right gradient — using them for a model would
 * confuse "this dot represents Claude" with "this dot is on the right".
 *
 * Colors are assigned in alphabetical order of the model key, so adding a
 * new model doesn't reshuffle existing ones.
 */
export const MODEL_PALETTE = [
  "#22c55e", // green
  "#f59e0b", // amber
  "#a78bfa", // violet
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#facc15", // yellow
  "#fb923c", // orange
  "#10b981", // emerald
  "#c084fc", // light purple
  "#34d399", // mint
  "#fde047", // pale yellow
  "#f472b6", // light pink
];

const FALLBACK_COLOR = "#94a3b8";

export type ModelKey = { provider: string; modelId: string };

export function modelKey(m: ModelKey): string {
  return `${m.provider}/${m.modelId}`;
}

/**
 * Assign a color from the palette to each model in the input list, preserving
 * the input order. Caller is expected to pass the SELECTED models only, so
 * the palette is never overwhelmed (typical: 1-8 selections vs. hundreds of
 * total models). Selection-order assignment means the first picked model
 * keeps its color when a later one is removed — no visual shuffling on
 * deselect.
 */
export function buildModelColors(
  models: ReadonlyArray<ModelKey>,
): Map<string, string> {
  return new Map(
    models.map((m, i) => [modelKey(m), MODEL_PALETTE[i % MODEL_PALETTE.length]]),
  );
}

export function colorFor(
  colors: Map<string, string>,
  m: ModelKey,
): string {
  return colors.get(modelKey(m)) ?? FALLBACK_COLOR;
}
