import Link from "next/link";
import { AnswerCompareTable } from "@/components/answer-compare-table";
import { AxisLabel } from "@/components/axis-label";
import { CompareModelPicker } from "@/components/compare-model-picker";
import { Card } from "@/components/ui/card";
import { GradientBlob } from "@/components/gradient-blob";
import { LeftRightScaleMulti } from "@/components/left-right-scale-multi";
import { PoliticalRadar } from "@/components/political-radar";
import {
  ESSENTIAL_RADAR_AXES,
  axisLabel,
  leftRightScore,
  orderAxesCanonical,
} from "@/lib/politiscales";
import { buildModelColors, colorFor } from "@/lib/model-colors";
import {
  listModelSummaries,
  getRunsForCompare,
} from "@/lib/queries";
import { modelHref, PROVIDER_LABEL } from "@/lib/format";
import type { Provider } from "@/lib/types";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ models?: string | string[] }>;

function parseModels(raw: string | string[] | undefined): Array<{
  provider: string;
  modelId: string;
}> {
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr
    .map((s) => {
      const i = s.indexOf("/");
      if (i < 0) return null;
      return { provider: s.slice(0, i), modelId: s.slice(i + 1) };
    })
    .filter((x): x is { provider: string; modelId: string } => x !== null);
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const requested = parseModels(sp.models);

  const allSummaries = await listModelSummaries();
  // Empty by default — let the user opt-in. The visualizations only render
  // once at least one model is selected.
  const pairs = requested;
  const runs = await getRunsForCompare(pairs);

  // Colors are assigned only to SELECTED models, in selection order. With a
  // 12-color palette and typical 1-8 selections, we never run out, and
  // removing a model doesn't reshuffle the others' colors.
  const modelColors = buildModelColors(
    pairs.map((p) => ({ provider: p.provider, modelId: p.modelId })),
  );

  // Union of axes touched by any selected run (for the full radar), ordered
  // canonically so the radar shape stays comparable across selections.
  const axisSet = new Set<string>();
  for (const r of runs) for (const s of r.scores) axisSet.add(s.axis);
  const allAxesList = orderAxesCanonical(Array.from(axisSet));

  const series = runs.map((r) => ({
    modelKey: `${r.provider}__${r.modelId}`,
    label: r.modelId,
    color: colorFor(modelColors, r),
  }));

  // Data points for the FULL radar
  const fullData = runs.flatMap((r) =>
    allAxesList.map((axis) => ({
      axis,
      model: `${r.provider}__${r.modelId}`,
      score: r.scores.find((s) => s.axis === axis)?.score ?? 0,
    })),
  );

  // Data points for the ESSENTIAL 4-pair (8-spoke) radar
  const essentialData = runs.flatMap((r) =>
    ESSENTIAL_RADAR_AXES.map((axis) => ({
      axis,
      model: `${r.provider}__${r.modelId}`,
      score: r.scores.find((s) => s.axis === axis)?.score ?? 0,
    })),
  );

  // L/R entries
  const lrEntries = runs.map((r) => ({
    provider: r.provider,
    modelId: r.modelId,
    score: leftRightScore(r.scores),
    color: colorFor(modelColors, r),
  }));

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <section className="relative overflow-hidden rounded-3xl glass p-10">
        <GradientBlob intensity={0.5} />
        <div className="relative">
          <h1 className="text-4xl font-semibold tracking-tight">Compare</h1>
          <p className="mt-2 max-w-2xl text-foreground/70">
            Overlay multiple LLMs on the same political map. Each model has a
            stable color used across every chart. Pick from the list — the URL
            stays shareable.
          </p>
        </div>
      </section>

      <section className="mt-8">
        <CompareModelPicker
          allSummaries={allSummaries}
          pairs={pairs}
          modelColors={Object.fromEntries(modelColors)}
        />
      </section>

      {runs.length > 0 && (
        <section className="mt-8">
          <Card className="glass p-8">
            <LeftRightScaleMulti entries={lrEntries} />
          </Card>
        </section>
      )}

      {runs.length === 0 && (
        <section className="mt-8">
          <Card className="glass p-12 text-center">
            <p className="text-foreground/60">
              Select one or more models above to overlay them on the radars
              and the L/R scale.
            </p>
          </Card>
        </section>
      )}

      {runs.length > 0 && (
        <>
          <section className="mt-8 grid gap-6 lg:grid-cols-2">
            <Card className="glass p-6">
              <div className="flex items-baseline justify-between">
                <h2 className="text-sm font-medium uppercase tracking-wide text-foreground/60">
                  Essential — 4 pairs
                </h2>
                <span className="text-xs text-foreground/40">
                  economy · culture · globalism · markets
                </span>
              </div>
              <div className="mt-2">
                <PoliticalRadar
                  axes={[...ESSENTIAL_RADAR_AXES]}
                  data={essentialData}
                  series={series}
                  height={420}
                />
              </div>
            </Card>

            <Card className="glass p-6">
              <div className="flex items-baseline justify-between">
                <h2 className="text-sm font-medium uppercase tracking-wide text-foreground/60">
                  Full radar
                </h2>
                <span className="text-xs text-foreground/40">
                  {allAxesList.length} axes touched
                </span>
              </div>
              <div className="mt-2">
                <PoliticalRadar
                  axes={allAxesList}
                  data={fullData}
                  series={series}
                  height={420}
                />
              </div>
            </Card>
          </section>

        </>
      )}

      {runs.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 text-2xl font-semibold tracking-tight">
            Score table
          </h2>
          <Card className="glass overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-white/5 text-left text-xs uppercase tracking-wide text-foreground/50">
                  <tr>
                    <th className="px-6 py-3">Axis</th>
                    {runs.map((r) => {
                      const color = colorFor(modelColors, r);
                      return (
                        <th
                          key={`${r.provider}/${r.modelId}`}
                          className="px-6 py-3"
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
                  {allAxesList.map((axis) => (
                    <tr key={axis}>
                      <td className="px-6 py-3 text-foreground/80">
                        <AxisLabel axis={axis} />
                      </td>
                      {runs.map((r) => {
                        const s = r.scores.find((x) => x.axis === axis);
                        return (
                          <td
                            key={`${r.provider}/${r.modelId}`}
                            className="px-6 py-3 font-mono tabular-nums text-foreground/70"
                          >
                            {s ? `${s.score.toFixed(1)}%` : "—"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      )}

      {runs.length > 0 && (
        <section className="mt-12">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">
              Per-question answers
            </h2>
            <p className="text-sm text-foreground/50">
              Questions where every model agreed are dimmed — divergences pop.
            </p>
          </div>
          <Card className="glass overflow-hidden">
            <AnswerCompareTable runs={runs} modelColors={modelColors} />
          </Card>
        </section>
      )}
    </div>
  );
}
