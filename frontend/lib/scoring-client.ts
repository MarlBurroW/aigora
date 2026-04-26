/**
 * Client-side port of `backend/politiscales/scoring.py`. Used by the
 * "Take the test yourself" flow: the visitor's 117 answers are scored
 * entirely in the browser — nothing is sent to the server.
 *
 * Behaviour is byte-equivalent to the Python version (which is itself a
 * faithful port of the upstream Politiscales JS scoring), including:
 *   - the quirk that `neutral` (value 0) still increments `sum` for the
 *     valuesNo axes,
 *   - the paired-axis renormalisation when both sides exceed 100%.
 */

import { dataset, type Question } from "./politiscales";

export type AnswerLabel =
  | "strongly_agree"
  | "agree"
  | "neutral"
  | "disagree"
  | "strongly_disagree"
  | "no_opinion";

export const ANSWER_VALUES: Partial<Record<AnswerLabel, number>> = {
  strongly_agree: 1,
  agree: 2 / 3,
  neutral: 0,
  disagree: -2 / 3,
  strongly_disagree: -1,
  // no_opinion is intentionally absent — it's filtered before the loop
};

export function computeScoresClient(
  answers: Record<string, AnswerLabel>,
): Record<string, number> {
  const byId: Record<string, Question> = {};
  for (const q of dataset.questions) byId[q.id] = q;

  type Acc = { val: number; sum: number };
  const raw: Record<string, Acc> = {};
  const acc = (axis: string): Acc => {
    if (!raw[axis]) raw[axis] = { val: 0, sum: 0 };
    return raw[axis];
  };

  for (const [qid, label] of Object.entries(answers)) {
    if (label === "no_opinion") continue;
    const v = ANSWER_VALUES[label];
    if (v === undefined) continue;
    const q = byId[qid];
    if (!q) continue; // hallucinated id — defensive

    if (v > 0) {
      for (const w of q.weights_yes) {
        const s = acc(w.axis);
        s.val += v * w.value;
        s.sum += Math.max(w.value, 0);
      }
    } else {
      for (const w of q.weights_no) {
        const s = acc(w.axis);
        s.val -= v * w.value; // v ≤ 0, so this adds positive
        s.sum += Math.max(w.value, 0);
      }
    }
  }

  // Paired-axis renormalisation: cap left + right at 100%
  for (const pair of dataset.axes.pairs) {
    const left = raw[pair.left];
    const right = raw[pair.right];
    if (!left || !right) continue;
    if (left.sum === 0 || right.sum === 0) continue;
    const pl = (left.val / left.sum) * 100;
    const pr = (right.val / right.sum) * 100;
    if (pl + pr > 100) {
      const ratio = 100 / (pl + pr);
      left.val *= ratio;
      right.val *= ratio;
    }
  }

  const out: Record<string, number> = {};
  for (const [axis, s] of Object.entries(raw)) {
    if (s.sum > 0) out[axis] = (s.val / s.sum) * 100;
  }
  return out;
}

/**
 * Encode answers into a compact URL-safe string. Order matches
 * dataset.questions order, so we only ship one digit per question.
 *
 *   strongly_agree    → "5"
 *   agree             → "4"
 *   neutral           → "3"
 *   disagree          → "2"
 *   strongly_disagree → "1"
 *   no_opinion / skip → "0"
 */
const LABEL_TO_DIGIT: Record<AnswerLabel | "skip", string> = {
  strongly_agree: "5",
  agree: "4",
  neutral: "3",
  disagree: "2",
  strongly_disagree: "1",
  no_opinion: "0",
  skip: "0",
};
const DIGIT_TO_LABEL: Record<string, AnswerLabel> = {
  "5": "strongly_agree",
  "4": "agree",
  "3": "neutral",
  "2": "disagree",
  "1": "strongly_disagree",
  "0": "no_opinion",
};

export function encodeAnswers(
  answers: Record<string, AnswerLabel | undefined>,
): string {
  return dataset.questions
    .map((q) => LABEL_TO_DIGIT[answers[q.id] ?? "skip"])
    .join("");
}

export function decodeAnswers(s: string): Record<string, AnswerLabel> {
  const out: Record<string, AnswerLabel> = {};
  for (let i = 0; i < dataset.questions.length && i < s.length; i++) {
    const lbl = DIGIT_TO_LABEL[s[i]];
    if (lbl) out[dataset.questions[i].id] = lbl;
  }
  return out;
}

/** Euclidean distance over the union of axes both profiles touched.
 *  Missing axes default to 0 (interpreted as "didn't engage with this side"). */
export function profileDistance(
  a: Record<string, number>,
  b: Record<string, number>,
): number {
  const allAxes = new Set([...Object.keys(a), ...Object.keys(b)]);
  let sumSq = 0;
  let n = 0;
  for (const axis of allAxes) {
    const av = a[axis] ?? 0;
    const bv = b[axis] ?? 0;
    sumSq += (av - bv) ** 2;
    n += 1;
  }
  return n === 0 ? 0 : Math.sqrt(sumSq / n);
}

/** Convert a distance to a 0–100 similarity score (100 = identical). */
export function profileSimilarity(distance: number): number {
  // distance is RMS of axis differences in [0, 100] — same scale.
  return Math.max(0, Math.min(100, 100 - distance));
}
