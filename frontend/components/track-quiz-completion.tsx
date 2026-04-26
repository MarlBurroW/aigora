"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

type Props = {
  /** "{provider}/{modelId}" of the closest LLM match. */
  match: string;
  /** Verdict label, e.g. "Center-Left". */
  verdict: string;
  /** Similarity 0..100, rounded. */
  similarity: number;
};

/** Fires the "Quiz completed" Plausible event once when the results page
 *  mounts. Lives in its own client component so the page can stay a server
 *  component (DB queries + scoring happen on the server). */
export function TrackQuizCompletion({ match, verdict, similarity }: Props) {
  useEffect(() => {
    track("Quiz completed", {
      match,
      verdict,
      similarity: Math.round(similarity),
    });
    // We intentionally only want to fire on first mount, not on prop changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
