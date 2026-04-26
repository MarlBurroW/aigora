type Props = {
  className?: string;
  /** strength 0..1 controlling opacity of the layered radial gradients */
  intensity?: number;
};

/** Decorative layered radial gradients that mimic the organic blobs in the
 * reference design. Pure CSS, zero JS, pointer-events disabled. */
export function GradientBlob({ className = "", intensity = 1 }: Props) {
  const a = 0.55 * intensity;
  const b = 0.40 * intensity;
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 -z-10 ${className}`}
      style={{
        background: `
          radial-gradient(circle at 30% 30%, color-mix(in srgb, var(--brand-blue) ${a * 100}%, transparent) 0%, transparent 55%),
          radial-gradient(circle at 70% 70%, color-mix(in srgb, var(--brand-green) ${b * 100}%, transparent) 0%, transparent 55%)
        `,
        filter: "blur(40px)",
      }}
    />
  );
}
