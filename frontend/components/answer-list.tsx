import { ANSWER_COLOR, ANSWER_LABEL } from "@/lib/format";
import { questionById } from "@/lib/politiscales";
import type { AnswerRow } from "@/lib/types";

type Props = {
  answers: AnswerRow[];
};

export function AnswerList({ answers }: Props) {
  // Preserve question dataset order rather than DB order so the list matches
  // what a human would have answered going through the test top-to-bottom.
  const order = Object.keys(questionById);
  const ordered = [...answers].sort(
    (a, b) => order.indexOf(a.questionId) - order.indexOf(b.questionId),
  );

  return (
    <ol className="divide-y divide-white/5">
      {ordered.map((row, i) => {
        const q = questionById[row.questionId];
        return (
          <li
            key={row.questionId}
            className="grid grid-cols-[2.5rem_1fr_9rem] gap-4 py-3 text-sm"
          >
            <span className="font-mono tabular-nums text-foreground/30">
              {String(i + 1).padStart(3, "0")}
            </span>
            <span className="text-foreground/80">
              {q?.text ?? row.questionId}
            </span>
            <span
              className={`text-right font-medium ${ANSWER_COLOR[row.response]}`}
            >
              {ANSWER_LABEL[row.response]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
