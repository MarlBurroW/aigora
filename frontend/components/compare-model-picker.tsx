"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useMemo, useState } from "react";
import { CreatorIcon } from "@/components/creator-icon";
import { SearchableInput } from "@/components/searchable-input";
import { CREATOR_LABEL, getCreator, shortModelName } from "@/lib/creator";
import { formatDateISO, formatDateShort } from "@/lib/format";
import type { ModelSummary, Provider } from "@/lib/types";

type Pair = { provider: string; modelId: string };

type Props = {
  allSummaries: ModelSummary[];
  pairs: Pair[];
  /** Colors are assigned only to currently SELECTED models. */
  modelColors: Record<string, string>;
};

const PROVIDER_TABS: Array<Provider | "all"> = [
  "all",
  "openai",
  "anthropic",
  "gemini",
  "openrouter",
];

const TAB_LABEL: Record<string, string> = {
  all: "All",
  openai: "OpenAI",
  anthropic: "Anthropic",
  gemini: "Google",
  openrouter: "OpenRouter",
};

export function CompareModelPicker({
  allSummaries,
  pairs,
  modelColors,
}: Props) {
  const [q, setQ] = useState("");
  const [providerFilter, setProviderFilter] = useState<Provider | "all">("all");

  const isActive = (s: ModelSummary) =>
    pairs.some((p) => p.provider === s.provider && p.modelId === s.modelId);

  const selectedSummaries = useMemo(
    () =>
      // Render in the same order as `pairs` so colors line up with the
      // visualizations.
      pairs
        .map((p) =>
          allSummaries.find(
            (s) => s.provider === p.provider && s.modelId === p.modelId,
          ),
        )
        .filter((s): s is ModelSummary => Boolean(s)),
    [pairs, allSummaries],
  );

  const unselected = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return allSummaries.filter((s) => {
      if (isActive(s)) return false;
      if (providerFilter !== "all" && s.provider !== providerFilter)
        return false;
      if (needle) {
        const creator = getCreator(s.provider as Provider, s.modelId);
        const haystack =
          `${CREATOR_LABEL[creator]} ${s.modelId}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSummaries, pairs, providerFilter, q]);

  // Provider tabs are only rendered if the cluster actually has models for
  // that provider — keeps the UI clean even if e.g. OpenRouter is disabled.
  const availableProviders = useMemo(() => {
    const set = new Set(allSummaries.map((s) => s.provider));
    return PROVIDER_TABS.filter((p) => p === "all" || set.has(p));
  }, [allSummaries]);

  const hrefForToggle = (s: ModelSummary) => {
    const active = isActive(s);
    const next = active
      ? pairs.filter(
          (p) => !(p.provider === s.provider && p.modelId === s.modelId),
        )
      : [...pairs, { provider: s.provider, modelId: s.modelId }];
    return (
      "/compare?" +
      next.map((p) => `models=${p.provider}/${p.modelId}`).join("&")
    );
  };

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="text-sm font-medium uppercase tracking-wide text-foreground/60">
            Models
          </h2>
          <p className="mt-1 text-xs text-foreground/50">
            {pairs.length === 0
              ? "Pick one or more models to overlay them."
              : `${pairs.length} selected · ${allSummaries.length - pairs.length} more available`}
          </p>
        </div>
      </div>

      {/* Selected pills — also serve as the legend for the visualizations */}
      {selectedSummaries.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {selectedSummaries.map((s) => {
            const key = `${s.provider}/${s.modelId}`;
            const color = modelColors[key] ?? "#94a3b8";
            return (
              <Link
                key={key}
                href={hrefForToggle(s)}
                className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] py-1 pl-2 pr-1 text-sm transition hover:bg-white/[0.10]"
                style={{ boxShadow: `inset 0 0 24px -10px ${color}` }}
              >
                <span
                  aria-hidden
                  className="size-2.5 rounded-full"
                  style={{
                    background: color,
                    boxShadow: `0 0 8px ${color}`,
                  }}
                />
                <CreatorIcon
                  creator={getCreator(s.provider as Provider, s.modelId)}
                  size={14}
                />
                <span className="font-medium">
                  {shortModelName(s.provider as Provider, s.modelId)}
                </span>
                <span className="ml-0.5 grid size-5 place-items-center rounded-full bg-white/5 text-foreground/50 transition group-hover:bg-rose-500/20 group-hover:text-rose-200">
                  <X size={11} />
                </span>
              </Link>
            );
          })}
          <Link
            href="/compare"
            className="text-xs text-foreground/40 underline underline-offset-2 hover:text-foreground/70"
          >
            clear all
          </Link>
        </div>
      )}

      {/* Filter row */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchableInput
          value={q}
          onChange={setQ}
          placeholder="Search models or providers…"
          className="w-full max-w-xs"
        />
        <div className="flex flex-wrap gap-1.5">
          {availableProviders.map((p) => {
            const active = providerFilter === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setProviderFilter(p)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
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
      </div>

      {/* Unselected list — scrollable */}
      <div className="mt-4">
        <div className="mb-2 text-xs uppercase tracking-wider text-foreground/40">
          {pairs.length > 0 ? "Pick more" : "Available"} · {unselected.length}
        </div>
        {unselected.length === 0 ? (
          <p className="rounded-lg border border-white/5 bg-white/[0.02] py-6 text-center text-sm text-foreground/45">
            {q || providerFilter !== "all"
              ? "No model matches the filter."
              : "All models already selected."}
          </p>
        ) : (
          <ul className="grid max-h-96 gap-1.5 overflow-y-auto pr-2 sm:grid-cols-2 lg:grid-cols-3">
            {unselected.map((s) => {
              const key = `${s.provider}/${s.modelId}`;
              return (
                <li key={key}>
                  <Link
                    href={hrefForToggle(s)}
                    className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-sm transition hover:border-white/15 hover:bg-white/[0.06]"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <CreatorIcon
                        creator={getCreator(s.provider as Provider, s.modelId)}
                        size={16}
                      />
                      <span className="truncate">
                        {shortModelName(s.provider as Provider, s.modelId)}
                      </span>
                    </span>
                    <time
                      dateTime={formatDateISO(s.latestRunStartedAt)}
                      title={formatDateISO(s.latestRunStartedAt)}
                      className="shrink-0 font-mono text-[10px] text-foreground/35"
                    >
                      {formatDateShort(s.latestRunStartedAt)}
                    </time>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
