import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { GradientBlob } from "@/components/gradient-blob";
import { iconForAxis } from "@/lib/axis-icons";
import {
  axisColor,
  axisDescription,
  axisLabel,
  dataset,
} from "@/lib/politiscales";

export const metadata = {
  title: "All political axes",
  description:
    "The 23 Politiscales axes used to map every LLM's political profile, with definitions and per-axis leaderboards.",
};

const PAIR_LABELS: Record<string, string> = {
  identity: "Identity",
  justice: "Justice",
  culture: "Culture",
  globalism: "Globalism",
  economy: "Economy",
  markets: "Markets",
  environment: "Environment",
  radicalism: "Radicalism",
};

export default function AxesIndexPage() {
  // Drop pairs that aren't actually used by any question (materialism /
  // idealism / sustainability / growth_at_all_costs are scored-only by
  // upstream Politiscales but no question references them).
  const livePairs = dataset.axes.pairs.filter(
    (p) => axisDescription(p.left) && axisDescription(p.right),
  );

  const unpaired = Object.keys(dataset.axes.unpaired).filter(
    (a) => axisDescription(a),
  );

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <section className="relative overflow-hidden rounded-3xl glass p-10">
        <GradientBlob intensity={0.5} />
        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-foreground/70">
            All Politiscales axes
          </div>
          <h1 className="text-4xl font-semibold tracking-tight">
            The 23 dimensions we measure
          </h1>
          <p className="mt-3 max-w-2xl text-foreground/70 text-lg">
            Politiscales scores each model on 8 paired dimensions (each with
            two opposing axes) plus 7 standalone &quot;badge&quot; axes.
            Together they describe an LLM&apos;s political profile in a way
            no left-right axis can.
          </p>
        </div>
      </section>

      {/* Paired axes — shown as left/right duels grouped by theme */}
      <section className="mt-10">
        <h2 className="mb-6 text-2xl font-semibold tracking-tight">
          Paired dimensions
          <span className="ml-3 text-sm font-normal text-foreground/45">
            8 themes · 16 axes
          </span>
        </h2>
        <div className="space-y-8">
          {livePairs.map((pair) => (
            <div key={pair.name}>
              <div className="mb-3 flex items-center gap-3">
                <div className="text-xs font-medium uppercase tracking-[0.18em] text-foreground/50">
                  {PAIR_LABELS[pair.name] ?? pair.name}
                </div>
                <div className="h-px flex-1 bg-white/[0.06]" />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <AxisCard axis={pair.left} />
                <AxisCard axis={pair.right} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Unpaired badges */}
      <section className="mt-12">
        <h2 className="mb-6 text-2xl font-semibold tracking-tight">
          Standalone badges
          <span className="ml-3 text-sm font-normal text-foreground/45">
            {unpaired.length} axes — earned only by positive endorsement
          </span>
        </h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {unpaired.map((axis) => (
            <AxisCard key={axis} axis={axis} />
          ))}
        </div>
      </section>
    </div>
  );
}

function AxisCard({ axis }: { axis: string }) {
  const Icon = iconForAxis(axis);
  const color = axisColor(axis);
  const description = axisDescription(axis);

  return (
    <Link href={`/axis/${axis}`} className="group block">
      <Card
        className="glass relative overflow-hidden p-5 transition hover:bg-white/[0.06] h-full"
        style={{
          boxShadow: `inset 0 0 60px -40px ${color}`,
        }}
      >
        <div className="flex items-start gap-3">
          <span
            className="grid size-9 place-items-center rounded-lg bg-white/[0.04] shrink-0"
            style={{ color }}
          >
            <Icon size={18} strokeWidth={2.25} />
          </span>
          <div className="min-w-0 flex-1">
            <div
              className="text-base font-semibold tracking-tight"
              style={{ color }}
            >
              {axisLabel(axis)}
            </div>
            {description && (
              <p className="mt-1.5 text-sm text-foreground/70 leading-snug">
                {description}
              </p>
            )}
            <div className="mt-3 inline-flex items-center gap-1 text-xs text-foreground/45 transition group-hover:text-foreground/80">
              View leaderboard
              <ArrowRight
                size={11}
                className="transition group-hover:translate-x-0.5"
              />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
