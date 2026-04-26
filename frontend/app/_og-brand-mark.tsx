/**
 * Static brand mark for OG images (Satori-compatible). Same compass + needle
 * + cardinal ticks as <BrandMark>, but rendered via raw SVG primitives so
 * the next/og runtime can rasterise it.
 */

const BRAND_BLUE = "#3b5cff";
const BRAND_GREEN = "#22c55e";

type Props = {
  size?: number;
};

export function OGBrandMark({ size = 56 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient
          id="og-needle-top"
          x1="50"
          y1="12"
          x2="50"
          y2="50"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor={BRAND_BLUE} stopOpacity="1" />
          <stop offset="100%" stopColor={BRAND_BLUE} stopOpacity="0.4" />
        </linearGradient>
        <linearGradient
          id="og-needle-bot"
          x1="50"
          y1="50"
          x2="50"
          y2="88"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor={BRAND_GREEN} stopOpacity="0.4" />
          <stop offset="100%" stopColor={BRAND_GREEN} stopOpacity="1" />
        </linearGradient>
      </defs>
      {/* Outer dial */}
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="none"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="2"
      />
      {/* Cardinal ticks */}
      <line x1="50" y1="6" x2="50" y2="14" stroke="rgba(255,255,255,0.4)" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="50" y1="86" x2="50" y2="94" stroke="rgba(255,255,255,0.4)" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="6" y1="50" x2="14" y2="50" stroke="rgba(255,255,255,0.4)" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="86" y1="50" x2="94" y2="50" stroke="rgba(255,255,255,0.4)" strokeWidth="2.4" strokeLinecap="round" />
      {/* Needle */}
      <polygon points="50,12 43,50 57,50" fill="url(#og-needle-top)" />
      <polygon points="50,88 43,50 57,50" fill="url(#og-needle-bot)" />
      {/* Pivot */}
      <circle cx="50" cy="50" r="5.5" fill="#0a0e1a" />
      <circle cx="50" cy="50" r="3.5" fill="white" />
      <circle cx="50" cy="50" r="1.6" fill={BRAND_BLUE} />
    </svg>
  );
}
