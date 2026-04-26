import { ImageResponse } from "next/og";
import { OGBrandMark } from "../../../_og-brand-mark";
import { CREATOR_LABEL, getCreator, shortModelName } from "@/lib/creator";
import {
  assessAnswerQuality,
  axisColor,
  axisLabel,
  describeLeftRight,
  leftRightScore,
  topAxesByScore,
} from "@/lib/politiscales";
import { getLatestRunIdFor, getRunDetails } from "@/lib/queries";
import { SITE } from "@/lib/site";
import type { Provider } from "@/lib/types";

export const alt = "Aigora — political profile of an LLM";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#0a0e1a";
const BRAND_BLUE = "#3b5cff";
const BRAND_GREEN = "#22c55e";

type Params = { provider: string; modelId: string };

export default async function ModelOpenGraphImage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { provider, modelId } = await params;
  const decoded = decodeURIComponent(modelId);

  const runId = await getLatestRunIdFor(provider, decoded);
  if (runId === null) return fallback(decoded, provider);
  const run = await getRunDetails(runId);
  if (!run) return fallback(decoded, provider);

  const lr = leftRightScore(run.scores);
  const desc = describeLeftRight(lr);
  const top = topAxesByScore(run.scores, 3);
  const quality = assessAnswerQuality(run.answers);
  const lrPct = (lr + 100) / 2;
  const lrSign = lr > 0 ? "+" : "";

  // Verdict color matches the L/R position so the headline visually mirrors
  // the score (blue=left, red=right, gray-ish=center).
  const verdictColor =
    desc.side === "left"
      ? "#60a5fa"
      : desc.side === "right"
        ? "#fb7185"
        : "#cbd5e1";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: BG,
          color: "white",
          padding: "60px",
          position: "relative",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <Blobs />

        {/* Header: brand wordmark */}
        <Wordmark />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "auto",
            gap: "24px",
          }}
        >
          {/* Provider · model_id row */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div
              style={{
                fontSize: "26px",
                color: "rgba(255,255,255,0.5)",
                textTransform: "uppercase",
                letterSpacing: "3px",
                fontWeight: 600,
              }}
            >
              {CREATOR_LABEL[getCreator(provider as Provider, decoded)]}
            </div>
            <div
              style={{
                fontSize: "62px",
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: "-2px",
              }}
            >
              {shortModelName(provider as Provider, decoded)}
            </div>
          </div>

          {/* Verdict */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "20px",
              marginTop: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: "78px",
                fontWeight: 700,
                color: verdictColor,
                letterSpacing: "-1.5px",
                textTransform: "uppercase",
              }}
            >
              {desc.label}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: "44px",
                fontWeight: 600,
                color: "rgba(255,255,255,0.4)",
                fontFamily: "monospace",
              }}
            >
              {`${lrSign}${lr.toFixed(0)}`}
            </div>
            {quality.flag !== "ok" && (
              <div
                style={{
                  display: "flex",
                  marginLeft: "12px",
                  padding: "8px 16px",
                  borderRadius: "999px",
                  background: "rgba(244,63,94,0.15)",
                  border: "2px solid rgba(244,63,94,0.4)",
                  color: "#fda4af",
                  fontSize: "20px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                }}
              >
                Unreliable
              </div>
            )}
          </div>

          {/* L/R bar */}
          <div
            style={{
              position: "relative",
              height: "10px",
              borderRadius: "999px",
              background:
                "linear-gradient(90deg, #1e40af 0%, #60a5fa 25%, #64748b 50%, #fb7185 75%, #dc2626 100%)",
              display: "flex",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: `${lrPct}%`,
                transform: "translate(-50%, -50%)",
                width: "26px",
                height: "26px",
                borderRadius: "50%",
                background: "white",
                border: `4px solid ${BG}`,
                boxShadow: "0 0 14px rgba(255,255,255,0.5)",
              }}
            />
          </div>

          {/* Top axes */}
          <div
            style={{
              display: "flex",
              gap: "32px",
              marginTop: "8px",
              fontSize: "28px",
              alignItems: "baseline",
            }}
          >
            {top.map((s) => (
              <div
                key={s.axis}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "10px",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    fontWeight: 700,
                    fontFamily: "monospace",
                    color: "rgba(255,255,255,0.95)",
                  }}
                >
                  {`${s.score.toFixed(0)}%`}
                </span>
                <span
                  style={{
                    display: "flex",
                    color: axisColor(s.axis),
                    fontWeight: 600,
                  }}
                >
                  {axisLabel(s.axis)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

/** Rendered if we couldn't find a run for the requested model — keeps the
 * site from emitting a broken image when the URL is wrong or the test
 * hasn't been run yet. */
function fallback(modelId: string, provider: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: BG,
          color: "white",
          padding: "70px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
        }}
      >
        <Blobs />
        <Wordmark />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "auto",
            gap: "20px",
          }}
        >
          <div
            style={{
              fontSize: "30px",
              color: "rgba(255,255,255,0.5)",
              textTransform: "uppercase",
              letterSpacing: "3px",
            }}
          >
            {CREATOR_LABEL[getCreator(provider as Provider, modelId)]}
          </div>
          <div
            style={{
              fontSize: "72px",
              fontWeight: 700,
              letterSpacing: "-2px",
            }}
          >
            {shortModelName(provider as Provider, modelId)}
          </div>
          <div
            style={{
              fontSize: "32px",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            Not yet tested.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

function Wordmark() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "14px",
      }}
    >
      <OGBrandMark size={48} />
      <div
        style={{
          fontSize: "36px",
          fontWeight: 700,
          letterSpacing: "-0.5px",
        }}
      >
        {SITE.name}
      </div>
    </div>
  );
}

function Blobs() {
  return (
    <>
      <div
        style={{
          position: "absolute",
          top: "-260px",
          right: "-260px",
          width: "700px",
          height: "700px",
          background: `radial-gradient(circle, ${BRAND_BLUE}aa 0%, transparent 70%)`,
          borderRadius: "50%",
          filter: "blur(40px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-260px",
          left: "-260px",
          width: "700px",
          height: "700px",
          background: `radial-gradient(circle, ${BRAND_GREEN}88 0%, transparent 70%)`,
          borderRadius: "50%",
          filter: "blur(40px)",
        }}
      />
    </>
  );
}
