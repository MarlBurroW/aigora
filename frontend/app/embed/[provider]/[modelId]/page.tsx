import Link from "next/link";
import { notFound } from "next/navigation";
import { AxisChip } from "@/components/axis-chip";
import { CreatorIcon } from "@/components/creator-icon";
import { LeftRightMini } from "@/components/left-right-mini";
import { PoliticalCompassMini } from "@/components/political-compass-mini";
import { CREATOR_LABEL, getCreator, shortModelName } from "@/lib/creator";
import {
  assessAnswerQuality,
  leftRightScore,
  topAxesByScore,
} from "@/lib/politiscales";
import { getLatestRunIdFor, getRunDetails } from "@/lib/queries";
import { SITE } from "@/lib/site";
import type { Provider } from "@/lib/types";

export const dynamic = "force-dynamic";

type Params = { provider: string; modelId: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}) {
  const { modelId } = await params;
  return { title: `Embed — ${decodeURIComponent(modelId)}` };
}

/**
 * Iframe-friendly view of a model's political profile. Designed to be
 * dropped into a blog or article via:
 *
 *   <iframe src="https://ai-gora.com/embed/<provider>/<modelId>"
 *           width="600" height="500" frameborder="0"></iframe>
 *
 * No nav, no footer, no padding waste. Renders the same compass + L/R
 * mini + axis chips as the home card, plus a small "tested on Aigora"
 * attribution that links back to the full model page.
 */
export default async function ModelEmbedPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { provider, modelId } = await params;
  const decoded = decodeURIComponent(modelId);

  const runId = await getLatestRunIdFor(provider, decoded);
  if (runId === null) notFound();
  const run = await getRunDetails(runId);
  if (!run) notFound();

  const creator = getCreator(provider as Provider, decoded);
  const display = shortModelName(provider as Provider, decoded);
  const lr = leftRightScore(run.scores);
  const top = topAxesByScore(run.scores, 3);
  const quality = assessAnswerQuality(run.answers);

  return (
    <div className="min-h-screen w-full p-5 sm:p-7">
      <div className="relative h-full w-full overflow-hidden rounded-2xl glass p-5 sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <CreatorIcon
              creator={creator}
              size={32}
              variant="avatar"
              className="rounded-lg shrink-0"
            />
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wide text-foreground/50">
                {CREATOR_LABEL[creator]}
              </div>
              <div className="font-semibold tracking-tight truncate">
                {display}
              </div>
            </div>
          </div>
          {quality.flag !== "ok" && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-rose-200">
              unreliable
            </span>
          )}
        </div>

        <div className="mt-5 flex items-center justify-center">
          <PoliticalCompassMini scores={run.scores} size={200} />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {top.map((s) => (
            <AxisChip
              key={s.axis}
              axis={s.axis}
              score={s.score}
              linked={false}
            />
          ))}
        </div>

        <div className="mt-5">
          <LeftRightMini score={lr} />
        </div>

        {/* Attribution */}
        <Link
          href={`/models/${provider}/${encodeURIComponent(decoded)}`}
          target="_top"
          className="mt-5 flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-xs text-foreground/55 transition hover:bg-white/[0.05] hover:text-foreground/85"
        >
          <span>
            Tested on{" "}
            <span className="font-semibold text-foreground/85">
              {SITE.name}
            </span>{" "}
            · view full profile
          </span>
          <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}
