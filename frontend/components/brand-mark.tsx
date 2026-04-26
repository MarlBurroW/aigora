type Props = {
  /** Pixel size of the rendered SVG. */
  size?: number;
  /** When true, the needle slowly oscillates and a radar sweep rotates
   *  behind it — used for the home hero. Off by default for header/favicon. */
  animated?: boolean;
  /** When true, omit the outer ring + tick marks. Useful for tight spaces
   *  (favicon-style minimal version). */
  minimal?: boolean;
  className?: string;
  title?: string;
};

const BRAND_BLUE = "#3b5cff";
const BRAND_GREEN = "#22c55e";

/**
 * The Aigora brand mark — a compass with a bicolor needle. Designed to read
 * as a "measurement instrument" at any size; the political-radar metaphor of
 * the site distilled into one icon.
 *
 * Pure SVG, no external assets. Animations are CSS-only (see globals.css).
 */
export function BrandMark({
  size = 32,
  animated = false,
  minimal = false,
  className,
  title = "Aigora",
}: Props) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      aria-label={title}
      role="img"
    >
      <defs>
        <linearGradient id="brandmark-needle-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={BRAND_BLUE} />
          <stop offset="100%" stopColor={BRAND_BLUE} stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="brandmark-needle-bot" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={BRAND_GREEN} stopOpacity="0.4" />
          <stop offset="100%" stopColor={BRAND_GREEN} />
        </linearGradient>
        <radialGradient id="brandmark-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={BRAND_BLUE} stopOpacity="0.4" />
          <stop offset="100%" stopColor={BRAND_BLUE} stopOpacity="0" />
        </radialGradient>
      </defs>

      {!minimal && (
        <>
          {/* soft inner glow */}
          <circle cx="50" cy="50" r="48" fill="url(#brandmark-glow)" />
          {/* outer dial */}
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="2"
          />
          {/* cardinal tick marks */}
          <g
            stroke="rgba(255,255,255,0.30)"
            strokeWidth="2.2"
            strokeLinecap="round"
          >
            <line x1="50" y1="6" x2="50" y2="14" />
            <line x1="50" y1="86" x2="50" y2="94" />
            <line x1="6" y1="50" x2="14" y2="50" />
            <line x1="86" y1="50" x2="94" y2="50" />
          </g>
        </>
      )}

      {/* radar sweep — only visible when animated */}
      {animated && (
        <g
          className="brandmark-sweep"
          style={{ transformOrigin: "50% 50%" }}
        >
          <path
            d="M 50 50 L 50 6 A 44 44 0 0 1 90 38 Z"
            fill={BRAND_BLUE}
            opacity="0.18"
          />
        </g>
      )}

      {/* needle — animated version oscillates around the center */}
      <g
        className={animated ? "brandmark-needle" : ""}
        style={{ transformOrigin: "50% 50%" }}
      >
        {/* top tip (blue, sharper) */}
        <polygon
          points="50,12 43,50 57,50"
          fill="url(#brandmark-needle-top)"
        />
        {/* bottom tip (green, softer) */}
        <polygon
          points="50,88 43,50 57,50"
          fill="url(#brandmark-needle-bot)"
        />
        {/* pivot */}
        <circle cx="50" cy="50" r="5.5" fill="rgba(15,18,28,0.95)" />
        <circle cx="50" cy="50" r="3.5" fill="white" />
        <circle cx="50" cy="50" r="1.6" fill={BRAND_BLUE} />
      </g>
    </svg>
  );
}
