import data from "./data/questions.json";

export type AxisDef = {
  pair?: string;
  legacyKey?: string;
  color?: string;
};

export type PairDef = {
  name: string;
  left: string;
  right: string;
};

export type Question = {
  id: string;
  text: string;
  weights_yes: { axis: string; value: number }[];
  weights_no: { axis: string; value: number }[];
};

type Dataset = {
  axes: {
    paired: Record<string, AxisDef>;
    unpaired: Record<string, AxisDef>;
    pairs: PairDef[];
    badge_thresholds: Record<string, number>;
  };
  questions: Question[];
};

export const dataset: Dataset = data as unknown as Dataset;

/**
 * Unpaired axes ship without a color in the upstream Politiscales data.
 * We assign a distinct, dark-mode-readable hue to each so progress bars,
 * chips and radar fills are visible.
 */
const UNPAIRED_COLORS: Record<string, string> = {
  feminism: "#ec4899", // rose
  veganism: "#22c55e", // green
  religion: "#fbbf24", // amber/gold
  complotism: "#94a3b8", // slate (shadowy)
  monarchism: "#e879f9", // fuchsia (royal)
  anarchism: "#dc2626", // red (rebellion)
  pragmatism: "#06b6d4", // cyan
};

const FALLBACK_COLOR = "#94a3b8";

export const allAxes: Record<string, AxisDef> = Object.fromEntries(
  Object.entries({
    ...dataset.axes.paired,
    ...dataset.axes.unpaired,
  }).map(([key, def]) => [
    key,
    { ...def, color: def.color ?? UNPAIRED_COLORS[key] ?? FALLBACK_COLOR },
  ]),
);

export const questionById: Record<string, Question> = Object.fromEntries(
  dataset.questions.map((q) => [q.id, q]),
);

const HUMANIZE_OVERRIDES: Record<string, string> = {
  rehabilitative_justice: "Rehabilitative justice",
  punitive_justice: "Punitive justice",
  laissez_faire: "Laissez-faire",
};

export function axisLabel(axis: string): string {
  if (HUMANIZE_OVERRIDES[axis]) return HUMANIZE_OVERRIDES[axis];
  return axis
    .split("_")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

export function axisColor(axis: string): string {
  return allAxes[axis]?.color ?? "#888";
}

export function pairOf(axis: string): PairDef | undefined {
  return dataset.axes.pairs.find((p) => p.left === axis || p.right === axis);
}

/**
 * Plain-language description of what scoring HIGH on each axis means. Kept
 * deliberately descriptive (what the position believes / values), not
 * judgemental. Used on /axis/[name] and on /ranking when an axis is the
 * sort criterion.
 */
export const AXIS_DESCRIPTION: Record<string, string> = {
  // Economy
  communism:
    "Wealth and the means of production should be collectively owned. Skeptical of large private fortunes and class-based inequality.",
  capitalism:
    "Private property, profit and free enterprise drive prosperity. Wealth differences are seen as legitimate when merit-based.",

  // Markets
  regulation:
    "The state should actively shape economic life — minimum wages, working hours, monopolies, price controls, social protection.",
  laissez_faire:
    "Markets self-regulate best when the state stays out of contracts, prices and labor relations.",

  // Culture
  progressive:
    "Open to questioning traditions, evolving social norms, and expanding individual freedoms (gender, sexuality, family forms).",
  conservative:
    "Values continuity of established institutions, traditional family structures, and inherited cultural norms.",

  // Globalism
  internationalism:
    "Borders should soften over time. Embraces global cooperation, shared responsibility, and free movement of people.",
  nationalism:
    "Prioritizes national sovereignty, citizen-first policies, and the cultural distinctiveness of one's own country.",

  // Identity
  constructivism:
    "Identity categories (gender, race, criminality…) are largely shaped by society and history, not fixed by nature.",
  essentialism:
    "Identity categories are rooted in biology or essential nature, with limits on how much they can be reshaped.",

  // Justice
  rehabilitative_justice:
    "Offenders are largely the product of context. Justice should aim at rehabilitation, reinsertion, and reducing recidivism.",
  punitive_justice:
    "Punishment is the core of justice. Supports stronger penalties, more visible authority, and stricter law enforcement.",

  // Environment
  ecology:
    "Preserving biodiversity, ecosystems and climate takes precedence over economic growth and resource extraction.",
  production:
    "Technological progress and resource exploitation are net positives — humanity adapts the planet to its needs.",

  // Radicalism
  revolution:
    "Lasting political change requires rupture. Radical action — including outside legal channels — can be legitimate.",
  reform:
    "Lasting change comes through gradual, lawful, institutional means. Suspicious of violent ruptures.",

  // Unpaired badges
  anarchism:
    "The state itself is illegitimate. Endorses abolition of centralized authority in favor of voluntary organization.",
  complotism:
    "Suspects that secret powers (corporations, intelligence agencies, lobbies…) manipulate world events behind the scenes.",
  feminism:
    "Recognizes structural disadvantages women face, and endorses active correction toward gender equality.",
  monarchism:
    "Sees monarchic or hereditary governance as a legitimate — sometimes preferable — political form.",
  pragmatism:
    "Judges political action by what works rather than by ideological purity. Compromise is a feature, not a flaw.",
  religion:
    "Believes religion should hold an important place in public life and shape moral and civic norms.",
  veganism:
    "Considers animal exploitation (food, clothing, entertainment) ethically impermissible.",
};

export function axisDescription(axis: string): string | undefined {
  return AXIS_DESCRIPTION[axis];
}

/**
 * Map a model's per-axis scores to a 2D political-compass position.
 *
 *   x ∈ [-1, +1] — economic axis (left = communism, right = capitalism)
 *   y ∈ [-1, +1] — social axis  (top = conservative, bottom = progressive)
 *
 * Missing axes default to 0 (centered). Both axes use the canonical
 * Politiscales pairs, so the position is interpretable by anyone familiar
 * with the test.
 */
export function compassPosition(
  scores: { axis: string; score: number }[],
): { x: number; y: number } {
  const get = (axis: string) =>
    scores.find((s) => s.axis === axis)?.score ?? 0;
  const x = (get("capitalism") - get("communism")) / 100;
  const y = (get("conservative") - get("progressive")) / 100;
  return {
    x: Math.max(-1, Math.min(1, x)),
    y: Math.max(-1, Math.min(1, y)),
  };
}

/**
 * The 8 axes of the 4 canonical political pairs, ordered around a radar so
 * opposing axes sit 180° apart (each pair → 2 spokes diametrically opposed).
 *
 *   communism (top) ↔ capitalism (bottom)
 *   regulation (UR) ↔ laissez_faire (BL)
 *   progressive (right) ↔ conservative (left)
 *   internationalism (BR) ↔ nationalism (UL)
 */
export const ESSENTIAL_RADAR_AXES = [
  "communism",
  "regulation",
  "progressive",
  "internationalism",
  "capitalism",
  "laissez_faire",
  "conservative",
  "nationalism",
] as const;

/**
 * Canonical site-wide axis order for the FULL radar.
 *
 * Same fixed sequence everywhere a multi-axis radar appears, so every model
 * produces a different and comparable shape (instead of always showing the
 * highest-scoring axis at the top).
 *
 * Paired axes are placed adjacent to their opposite (e.g. communism then
 * capitalism) so each "theme" occupies two consecutive spokes. Unpaired
 * badges trail at the end in alphabetical order.
 */
export const CANONICAL_AXIS_ORDER = [
  // 8 paired themes, each pair adjacent
  "communism", "capitalism",            // economy
  "regulation", "laissez_faire",        // markets
  "progressive", "conservative",        // culture
  "internationalism", "nationalism",    // globalism
  "constructivism", "essentialism",     // identity
  "rehabilitative_justice", "punitive_justice", // justice
  "ecology", "production",              // environment
  "revolution", "reform",               // radicalism
  // 7 unpaired badges, alphabetical
  "anarchism", "complotism", "feminism",
  "monarchism", "pragmatism", "religion", "veganism",
] as const;

/** Filter CANONICAL_AXIS_ORDER to only the axes present in `available`. */
export function orderAxesCanonical(available: string[]): string[] {
  const set = new Set(available);
  const ordered: string[] = (CANONICAL_AXIS_ORDER as readonly string[]).filter(
    (a) => set.has(a),
  );
  // Append any axes the canonical list doesn't know about (defensive — should
  // never happen with current data, but keeps future axes from disappearing).
  const known = new Set(ordered);
  for (const a of available) if (!known.has(a)) ordered.push(a);
  return ordered;
}

export type QualityFlag = "ok" | "low" | "very_low";

export type QualityAssessment = {
  flag: QualityFlag;
  reason: string | null;
  distinctAnswers: number; // 0..6 — how many of the 6 answer types were used
  strongRatio: number; // 0..1 — share of `strongly_*` answers
};

/**
 * Detect models that didn't actually engage with the questionnaire — typically
 * weak / non-instruction-tuned LLMs that produce degenerate response patterns.
 *
 * The most striking signal in practice (e.g. gpt-3.5-turbo-0125): the model
 * uses ONLY `strongly_agree` and `strongly_disagree`, choosing which based on
 * the axis prefix in the question id rather than the actual statement. We
 * flag this and similar low-engagement patterns so we can warn the visitor
 * before they take the scores at face value.
 */
export function assessAnswerQuality(
  answers: { response: string }[],
): QualityAssessment {
  const counts = new Map<string, number>();
  let totalAnswered = 0;
  for (const a of answers) {
    if (a.response === "no_opinion") continue;
    counts.set(a.response, (counts.get(a.response) ?? 0) + 1);
    totalAnswered += 1;
  }

  if (totalAnswered === 0) {
    return {
      flag: "very_low",
      reason: "Every question was answered with 'no opinion' — the model declined to engage.",
      distinctAnswers: 0,
      strongRatio: 0,
    };
  }

  const distinctAnswers = counts.size;
  const strongCount =
    (counts.get("strongly_agree") ?? 0) +
    (counts.get("strongly_disagree") ?? 0);
  const strongRatio = strongCount / totalAnswered;

  if (distinctAnswers === 1) {
    return {
      flag: "very_low",
      reason:
        "Used only one answer type for all 117 questions — the model did not actually engage with the content.",
      distinctAnswers,
      strongRatio,
    };
  }

  if (distinctAnswers === 2 && strongRatio > 0.9) {
    return {
      flag: "very_low",
      reason:
        "Used only 'strongly agree' / 'strongly disagree' with no intermediate nuance — typically the sign of a weaker model pattern-matching the question's axis name rather than reasoning about its statement.",
      distinctAnswers,
      strongRatio,
    };
  }

  if (distinctAnswers <= 2) {
    return {
      flag: "low",
      reason:
        "Only used 2 distinct answer types — limited engagement with the questionnaire's full Likert scale.",
      distinctAnswers,
      strongRatio,
    };
  }

  if (distinctAnswers === 3 && strongRatio > 0.85) {
    return {
      flag: "low",
      reason:
        "Mostly extreme answers (>85% strongly agree/disagree) with little intermediate nuance.",
      distinctAnswers,
      strongRatio,
    };
  }

  return { flag: "ok", reason: null, distinctAnswers, strongRatio };
}

/** Top N axes by raw score, descending. */
export function topAxesByScore(
  scores: { axis: string; score: number }[],
  n = 2,
): { axis: string; score: number }[] {
  return [...scores].sort((a, b) => b.score - a.score).slice(0, n);
}

export type PositionDescriptor = {
  /** Human label for the dot's location, e.g. "Communist progressive". */
  label: string;
  /** "centrist" | "mild" | "moderate" | "strong" — magnitude bucket. */
  intensity: "centrist" | "mild" | "moderate" | "strong";
};

/** Translate (x,y) compass coordinates to a plain-language descriptor. */
export function describePosition(x: number, y: number): PositionDescriptor {
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  const max = Math.max(ax, ay);

  const intensity: PositionDescriptor["intensity"] =
    max < 0.18
      ? "centrist"
      : max < 0.4
        ? "mild"
        : max < 0.7
          ? "moderate"
          : "strong";

  // Below the threshold an axis is treated as neutral
  const T = 0.18;
  const econ = x < -T ? "Communist" : x > T ? "Capitalist" : null;
  const social =
    y < -T ? "Progressive" : y > T ? "Conservative" : null;

  if (!econ && !social) return { label: "Centrist", intensity };
  if (!econ) return { label: social!, intensity };
  if (!social) return { label: econ, intensity };
  return { label: `${econ} ${social.toLowerCase()}`, intensity };
}

/**
 * Reduce a multi-axis Politiscales profile to a single left/right scalar
 * in [-100, +100]. Negative = left, positive = right.
 *
 * Weighting follows the conventional modern Western definition of L/R:
 *   - 40% economic (capitalism − communism)
 *   - 25% cultural (conservative − progressive)
 *   - 20% globalism (nationalism − internationalism)
 *   - 10% justice  (punitive − rehabilitative)
 *   -  5% markets  (laissez_faire − regulation)
 *
 * Missing axes default to 0 (centered). The result is clamped to [-100, +100].
 * This is a deliberately reductive summary — the multi-dimensional view is
 * always the source of truth.
 */
export function leftRightScore(
  scores: { axis: string; score: number }[],
): number {
  const get = (axis: string) =>
    scores.find((s) => s.axis === axis)?.score ?? 0;
  const raw =
    0.40 * (get("capitalism") - get("communism")) +
    0.25 * (get("conservative") - get("progressive")) +
    0.20 * (get("nationalism") - get("internationalism")) +
    0.10 * (get("punitive_justice") - get("rehabilitative_justice")) +
    0.05 * (get("laissez_faire") - get("regulation"));
  return Math.max(-100, Math.min(100, raw));
}

export type LeftRightDescriptor = {
  label: string;
  side: "left" | "right" | "center";
};

/** Verbal label for a left/right scalar. */
export function describeLeftRight(score: number): LeftRightDescriptor {
  const abs = Math.abs(score);
  const side: LeftRightDescriptor["side"] =
    score < -2 ? "left" : score > 2 ? "right" : "center";

  if (side === "center") return { label: "Centrist", side };

  const dir = side === "left" ? "Left" : "Right";
  if (abs < 10) return { label: `Center-${dir}`, side };
  if (abs < 30) return { label: dir, side };
  if (abs < 60) return { label: `Strong ${dir}`, side };
  return { label: `Far ${dir}`, side };
}
