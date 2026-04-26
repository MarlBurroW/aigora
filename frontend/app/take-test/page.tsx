"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { GradientBlob } from "@/components/gradient-blob";
import { dataset } from "@/lib/politiscales";
import { encodeAnswers, type AnswerLabel } from "@/lib/scoring-client";

const STORAGE_KEY = "aigora.quiz.v1";

type QuizState = {
  answers: Record<string, AnswerLabel>;
  cursor: number; // index into dataset.questions
};

const ANSWER_BUTTONS: Array<{
  label: AnswerLabel;
  text: string;
  shortcut: string;
  className: string;
}> = [
  {
    label: "strongly_agree",
    text: "Strongly agree",
    shortcut: "1",
    className:
      "border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-100",
  },
  {
    label: "agree",
    text: "Agree",
    shortcut: "2",
    className:
      "border-emerald-500/15 bg-emerald-500/5 hover:bg-emerald-500/15 text-emerald-200/85",
  },
  {
    label: "neutral",
    text: "Neutral",
    shortcut: "3",
    className: "border-white/10 bg-white/[0.03] hover:bg-white/10 text-foreground/75",
  },
  {
    label: "disagree",
    text: "Disagree",
    shortcut: "4",
    className:
      "border-rose-500/15 bg-rose-500/5 hover:bg-rose-500/15 text-rose-200/85",
  },
  {
    label: "strongly_disagree",
    text: "Strongly disagree",
    shortcut: "5",
    className:
      "border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-100",
  },
];

export default function TakeTestPage() {
  const router = useRouter();
  const [state, setState] = useState<QuizState>({ answers: {}, cursor: 0 });
  const [hydrated, setHydrated] = useState(false);

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as QuizState;
        if (parsed && typeof parsed === "object" && parsed.answers) {
          setState({
            answers: parsed.answers,
            cursor: Math.min(
              parsed.cursor ?? 0,
              dataset.questions.length - 1,
            ),
          });
        }
      }
    } catch {
      /* ignore corrupt local state */
    }
    setHydrated(true);
  }, []);

  // Persist on every change (after hydration so we don't wipe storage on mount)
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* localStorage full / disabled */
    }
  }, [state, hydrated]);

  const total = dataset.questions.length;
  const cursor = Math.min(state.cursor, total - 1);
  const question = dataset.questions[cursor];
  const answeredCount = Object.keys(state.answers).length;
  const percent = (answeredCount / total) * 100;

  const submit = useCallback(
    (answers: Record<string, AnswerLabel>) => {
      const encoded = encodeAnswers(answers);
      router.push(`/take-test/results?a=${encoded}`);
    },
    [router],
  );

  const choose = useCallback(
    (label: AnswerLabel) => {
      setState((s) => {
        const newAnswers = { ...s.answers, [question.id]: label };
        // If this was the last question, submit immediately
        if (s.cursor >= total - 1) {
          submit(newAnswers);
          return { answers: newAnswers, cursor: s.cursor };
        }
        return {
          answers: newAnswers,
          cursor: s.cursor + 1,
        };
      });
    },
    [question, total, submit],
  );

  const goBack = useCallback(() => {
    setState((s) => ({ answers: s.answers, cursor: Math.max(0, s.cursor - 1) }));
  }, []);

  const skip = useCallback(() => {
    choose("no_opinion");
  }, [choose]);

  const reset = useCallback(() => {
    if (
      typeof window !== "undefined" &&
      !window.confirm("Reset all answers and start over?")
    ) {
      return;
    }
    setState({ answers: {}, cursor: 0 });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key >= "1" && e.key <= "5") {
        const idx = Number(e.key) - 1;
        choose(ANSWER_BUTTONS[idx].label);
      } else if (e.key === " " || e.key.toLowerCase() === "s") {
        e.preventDefault();
        skip();
      } else if (e.key === "ArrowLeft") {
        goBack();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [choose, skip, goBack]);

  // If user has finished but is still on page (e.g. navigated back), allow submit
  const finished = answeredCount === total;

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mx-auto max-w-3xl">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl glass p-8 sm:p-10">
          <GradientBlob intensity={0.4} />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-foreground/70">
                Take the test
              </div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Where do <span className="text-gradient">you</span> stand?
              </h1>
              <p className="mt-2 max-w-xl text-foreground/70">
                Answer the same 117 Politiscales statements every LLM has
                answered, then see which model you&apos;re closest to.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-1.5 text-xs text-foreground/70 transition hover:bg-white/5"
              >
                <ArrowLeft size={12} />
                Back
              </Link>
              {answeredCount > 0 && (
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-1.5 text-xs text-foreground/70 transition hover:bg-white/5"
                >
                  <RefreshCw size={12} />
                  Reset
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Progress */}
        <div className="mt-8">
          <div className="mb-2 flex items-baseline justify-between text-xs uppercase tracking-wider text-foreground/55">
            <span>
              Question{" "}
              <span className="font-mono text-foreground/85">
                {cursor + 1}
              </span>{" "}
              of <span className="font-mono">{total}</span>
            </span>
            <span className="text-foreground/45">
              {answeredCount} answered · {Math.round(percent)}% done
            </span>
          </div>
          <div className="h-1 w-full rounded-full bg-white/[0.05] overflow-hidden">
            <div
              className="h-full rounded-full transition-[width]"
              style={{
                width: `${percent}%`,
                background: "linear-gradient(90deg, var(--brand-blue), var(--brand-green))",
                boxShadow: "0 0 14px var(--brand-blue)",
              }}
            />
          </div>
        </div>

        {/* Question */}
        <Card className="glass mt-6 p-7 sm:p-9">
          <p className="text-xl sm:text-2xl font-medium leading-snug text-foreground/95">
            “{question.text}”
          </p>

          <div className="mt-7 grid gap-2 sm:grid-cols-5">
            {ANSWER_BUTTONS.map((btn) => {
              const active = state.answers[question.id] === btn.label;
              return (
                <button
                  key={btn.label}
                  type="button"
                  onClick={() => choose(btn.label)}
                  className={`group relative flex flex-col items-center justify-center gap-1.5 rounded-xl border ${btn.className} px-3 py-4 text-sm font-medium transition ${
                    active ? "ring-2 ring-white/30" : ""
                  }`}
                >
                  <span className="text-xs font-mono text-foreground/35 group-hover:text-foreground/55">
                    {btn.shortcut}
                  </span>
                  <span className="text-center leading-tight">{btn.text}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={goBack}
              disabled={cursor === 0}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-foreground/55 transition hover:bg-white/5 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft size={14} />
              Previous
            </button>
            <button
              type="button"
              onClick={skip}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 italic text-amber-200/70 transition hover:bg-amber-500/10 hover:text-amber-200"
            >
              Skip / no opinion
              <ChevronRight size={14} />
            </button>
          </div>

          <p className="mt-4 text-center text-[11px] text-foreground/35">
            Keyboard:{" "}
            <kbd className="rounded bg-white/5 px-1.5 py-0.5 font-mono">1</kbd>–
            <kbd className="rounded bg-white/5 px-1.5 py-0.5 font-mono">5</kbd>{" "}
            to answer ·{" "}
            <kbd className="rounded bg-white/5 px-1.5 py-0.5 font-mono">S</kbd>{" "}
            to skip ·{" "}
            <kbd className="rounded bg-white/5 px-1.5 py-0.5 font-mono">←</kbd>{" "}
            back
          </p>
        </Card>

        {finished && (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => submit(state.answers)}
              className="w-full rounded-xl glass p-5 text-center text-base font-semibold transition hover:bg-white/[0.06]"
            >
              See my result →
            </button>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-foreground/40">
          Your answers are stored locally in your browser only. Nothing is sent
          to a server until you click&nbsp;<em>see my result</em>, and even
          then only as a URL hash to compute your scores.
        </p>
      </div>
    </div>
  );
}
