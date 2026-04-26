import { ImageResponse } from "next/og";
import { listModelSummaries } from "@/lib/queries";
import { SITE } from "@/lib/site";

// Image metadata
export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#0a0e1a";
const BRAND_BLUE = "#3b5cff";
const BRAND_GREEN = "#22c55e";

/**
 * Generated at build/request time. Pulls the live model count from Postgres
 * so the social card always reflects current scale.
 */
export default async function HomeOpenGraphImage() {
  // Best-effort live count; fall back gracefully if the DB isn't reachable
  // (e.g. during build).
  let modelCount = 0;
  try {
    modelCount = (await listModelSummaries()).length;
  } catch {
    /* ignore */
  }

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
          position: "relative",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Decorative gradient blobs (matches the site's hero) */}
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

        {/* Top: wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "22px",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "18px",
              background: `linear-gradient(135deg, ${BRAND_BLUE}, ${BRAND_GREEN})`,
              boxShadow: `0 0 60px ${BRAND_BLUE}88`,
            }}
          />
          <div
            style={{
              fontSize: "56px",
              fontWeight: 700,
              letterSpacing: "-1px",
            }}
          >
            {SITE.name}
          </div>
        </div>

        {/* Headline takes the remaining vertical space */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "auto",
            gap: "30px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: "92px",
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: "-3px",
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.95)" }}>
              The political map
            </span>
            <span
              style={{
                background: `linear-gradient(120deg, ${BRAND_BLUE}, ${BRAND_GREEN})`,
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              of every LLM.
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "32px",
              fontSize: "26px",
              color: "rgba(255,255,255,0.55)",
              fontWeight: 500,
            }}
          >
            <Stat value={modelCount > 0 ? `${modelCount}+` : "Many"} label="LLMs tested" />
            <Dot />
            <Stat value="23" label="political axes" />
            <Dot />
            <Stat value="117" label="questions" />
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
      <span
        style={{
          color: "rgba(255,255,255,0.95)",
          fontSize: "34px",
          fontWeight: 700,
        }}
      >
        {value}
      </span>
      <span>{label}</span>
    </div>
  );
}

function Dot() {
  return (
    <div
      style={{
        width: "5px",
        height: "5px",
        borderRadius: "50%",
        background: "rgba(255,255,255,0.25)",
      }}
    />
  );
}
