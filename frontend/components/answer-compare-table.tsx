import Link from "next/link";
import { AnswerPill } from "@/components/answer-pill";
import { dataset } from "@/lib/politiscales";
import { modelHref } from "@/lib/format";
import type { RunDetails } from "@/lib/types";

type Props = {
  runs: RunDetails[];
  modelColors: Map<string, string>;
};

export function AnswerCompareTable({ runs, modelColors }: Props) {
  // Pre-index answers by (run, questionId) for O(1) lookups
  const lookup = new Map<string, Map<string, string>>();
  for (const r of runs) {
    const m = new Map<string, string>();
    for (const a of r.answers) m.set(a.questionId, a.response);
    lookup.set(`${r.provider}/${r.modelId}`, m);
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-white/5 text-left text-xs uppercase tracking-wide text-foreground/50">
          <tr>
            <th className="sticky left-0 z-10 bg-background/80 px-6 py-3 backdrop-blur-md">
              Question
            </th>
            {runs.map((r) => {
              const color = modelColors.get(`${r.provider}/${r.modelId}`);
              return (
                <th
                  key={`${r.provider}/${r.modelId}`}
                  className="px-4 py-3 text-left"
                >
                  <Link
                    href={modelHref(r.provider, r.modelId)}
                    className="inline-flex items-center gap-2 hover:text-foreground/80"
                  >
                    <span
                      aria-hidden
                      className="size-2 rounded-full shrink-0"
                      style={{ background: color }}
                    />
                    {r.modelId}
                  </Link>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {dataset.questions.map((q, i) => {
            // Detect "all models agreed" rows so we can dim them: real
            // signal is in the rows where models DIVERGE.
            const responses = runs.map(
              (r) => lookup.get(`${r.provider}/${r.modelId}`)?.get(q.id),
            );
            const filled = responses.filter(Boolean) as string[];
            const allSame =
              filled.length === runs.length && new Set(filled).size === 1;

            return (
              <tr
                key={q.id}
                className={allSame ? "opacity-45" : "hover:bg-white/[0.02]"}
              >
                <td className="sticky left-0 z-10 bg-background/80 px-6 py-3 align-top backdrop-blur-md">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-xs tabular-nums text-foreground/30">
                      {String(i + 1).padStart(3, "0")}
                    </span>
                    <span className="text-foreground/85">{q.text}</span>
                  </div>
                </td>
                {runs.map((r, ri) => (
                  <td key={`${r.provider}/${r.modelId}`} className="px-4 py-3 align-top">
                    <AnswerPill answer={responses[ri] as never} />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
