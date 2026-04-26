"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ModelCard } from "@/components/model-card";
import { SearchableInput } from "@/components/searchable-input";
import { PROVIDER_LABEL } from "@/lib/format";
import type {
  AxisScore,
  ModelSummary,
  Provider,
  QualityAssessment,
} from "@/lib/types";

type Item = {
  summary: ModelSummary;
  scores: AxisScore[];
  quality: QualityAssessment;
  lrScore: number;
};

type Props = {
  items: Item[];
};

const PAGE_SIZE = 24;

type SortMode = "default" | "lr-asc" | "lr-desc" | "date-desc";

const SORT_LABEL: Record<SortMode, string> = {
  default: "Provider / name",
  "lr-asc": "Left → Right",
  "lr-desc": "Right → Left",
  "date-desc": "Most recent first",
};

const PROVIDER_TABS: Array<Provider | "all"> = [
  "all",
  "openai",
  "anthropic",
  "gemini",
  "xai",
  "openrouter",
];

const TAB_LABEL: Record<string, string> = {
  all: "All",
  openai: "OpenAI",
  anthropic: "Anthropic",
  gemini: "Google",
  xai: "xAI",
  openrouter: "OpenRouter",
};

export function HomeModelGrid({ items }: Props) {
  const [q, setQ] = useState("");
  const [providerFilter, setProviderFilter] = useState<Provider | "all">("all");
  const [sortMode, setSortMode] = useState<SortMode>("default");
  // Low-quality models pollute the visual signal — hide them by default
  // (toggle in the toolbar lets users opt them back in).
  const [hideLowQuality, setHideLowQuality] = useState(true);
  const [page, setPage] = useState(1);

  // Provider tabs only show if the data has at least one model from that
  // provider — keeps the UI clean when e.g. OpenRouter isn't enabled yet.
  const availableProviders = useMemo(() => {
    const set = new Set(items.map((i) => i.summary.provider));
    return PROVIDER_TABS.filter((p) => p === "all" || set.has(p));
  }, [items]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = items.filter(({ summary, quality }) => {
      if (providerFilter !== "all" && summary.provider !== providerFilter)
        return false;
      if (hideLowQuality && quality.flag !== "ok") return false;
      if (needle) {
        const provider = summary.provider as Provider;
        const haystack = `${PROVIDER_LABEL[provider] ?? summary.provider} ${summary.modelId}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
    // Apply sort
    switch (sortMode) {
      case "lr-asc":
        out = [...out].sort((a, b) => a.lrScore - b.lrScore);
        break;
      case "lr-desc":
        out = [...out].sort((a, b) => b.lrScore - a.lrScore);
        break;
      case "date-desc":
        out = [...out].sort(
          (a, b) =>
            new Date(b.summary.latestRunStartedAt).getTime() -
            new Date(a.summary.latestRunStartedAt).getTime(),
        );
        break;
      // default: keep server-side order
    }
    return out;
  }, [items, q, providerFilter, hideLowQuality, sortMode]);

  // Reset to page 1 whenever the active filter changes the result set
  useEffect(() => {
    setPage(1);
  }, [q, providerFilter, hideLowQuality, sortMode]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const endIdx = Math.min(startIdx + PAGE_SIZE, filtered.length);
  const paged = filtered.slice(startIdx, endIdx);

  return (
    <>
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchableInput
          value={q}
          onChange={setQ}
          placeholder="Search models or providers…"
          className="w-full max-w-sm"
        />
        <p className="text-sm text-foreground/50">
          {filtered.length === 0
            ? "0 models"
            : filtered.length === items.length
              ? `Showing ${startIdx + 1}–${endIdx} of ${items.length} models`
              : `Showing ${startIdx + 1}–${endIdx} of ${filtered.length} (filtered from ${items.length})`}
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        <div className="flex flex-wrap gap-1">
          {availableProviders.map((p) => {
            const active = providerFilter === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setProviderFilter(p)}
                className={`rounded-md px-2.5 py-1 font-medium transition ${
                  active
                    ? "bg-white/15 text-foreground"
                    : "text-foreground/55 hover:bg-white/5 hover:text-foreground/85"
                }`}
              >
                {TAB_LABEL[p]}
              </button>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <label className="inline-flex items-center gap-1.5 text-foreground/65">
            <span className="text-foreground/45">Sort:</span>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-foreground transition hover:bg-white/[0.08] focus:outline-none focus:ring-1 focus:ring-white/20"
            >
              {(Object.keys(SORT_LABEL) as SortMode[]).map((m) => (
                <option
                  key={m}
                  value={m}
                  className="bg-zinc-950 text-foreground"
                >
                  {SORT_LABEL[m]}
                </option>
              ))}
            </select>
          </label>

          <label className="inline-flex cursor-pointer items-center gap-1.5 text-foreground/65 transition hover:text-foreground/90">
            <input
              type="checkbox"
              checked={hideLowQuality}
              onChange={(e) => setHideLowQuality(e.target.checked)}
              className="size-3.5 rounded border-white/20 bg-white/5 accent-white"
            />
            Hide low quality
          </label>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-foreground/60">
          No model matches{" "}
          <code className="rounded bg-white/5 px-2 py-1 font-mono text-xs">
            {q}
          </code>
          .
        </div>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {paged.map(({ summary, scores, quality }) => (
              <ModelCard
                key={`${summary.provider}/${summary.modelId}`}
                summary={summary}
                scores={scores}
                quality={quality}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              page={safePage}
              total={totalPages}
              onChange={setPage}
            />
          )}
        </>
      )}
    </>
  );
}

function Pagination({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (n: number) => void;
}) {
  // Build a compact page list: 1 ... (page-1) page (page+1) ... last
  const visible = new Set<number>([1, total, page, page - 1, page + 1]);
  const numbers = Array.from(visible)
    .filter((n) => n >= 1 && n <= total)
    .sort((a, b) => a - b);

  // Insert ellipses where there's a gap
  const items: Array<number | "…"> = [];
  numbers.forEach((n, i) => {
    if (i > 0 && n - numbers[i - 1] > 1) items.push("…");
    items.push(n);
  });

  return (
    <nav className="mt-10 flex items-center justify-center gap-1.5 text-sm">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="inline-flex items-center gap-1 rounded-md border border-white/10 px-3 py-1.5 text-foreground/70 transition hover:bg-white/5 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <ChevronLeft size={14} />
        Prev
      </button>
      {items.map((it, i) =>
        it === "…" ? (
          <span
            key={`gap-${i}`}
            className="px-2 text-foreground/30 select-none"
            aria-hidden
          >
            …
          </span>
        ) : (
          <button
            key={it}
            type="button"
            onClick={() => onChange(it)}
            aria-current={it === page ? "page" : undefined}
            className={`min-w-9 rounded-md px-3 py-1.5 transition ${
              it === page
                ? "bg-white/15 text-foreground"
                : "text-foreground/65 hover:bg-white/5 hover:text-foreground"
            }`}
          >
            {it}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= total}
        className="inline-flex items-center gap-1 rounded-md border border-white/10 px-3 py-1.5 text-foreground/70 transition hover:bg-white/5 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
      >
        Next
        <ChevronRight size={14} />
      </button>
    </nav>
  );
}
