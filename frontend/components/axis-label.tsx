import Link from "next/link";
import { iconForAxis } from "@/lib/axis-icons";
import { axisColor, axisLabel } from "@/lib/politiscales";

type Props = {
  axis: string;
  size?: number;
  /** Hide the text label, keep only the icon (useful for tight spaces). */
  iconOnly?: boolean;
  className?: string;
  /** When true (default), wraps in a Link to /axis/[axis]. */
  linked?: boolean;
};

/** Canonical "this is axis X" inline element — icon + name, consistent
 * across every place the site mentions a Politiscales axis. By default
 * the whole element links to the axis's leaderboard page. */
export function AxisLabel({
  axis,
  size = 14,
  iconOnly = false,
  className = "",
  linked = true,
}: Props) {
  const Icon = iconForAxis(axis);
  const color = axisColor(axis);
  const inner = (
    <>
      <Icon
        size={size}
        style={{ color }}
        strokeWidth={2.25}
        aria-hidden
        className="shrink-0"
      />
      {!iconOnly && <span>{axisLabel(axis)}</span>}
    </>
  );
  const baseClass = `inline-flex items-center gap-1.5 ${className}`;
  if (!linked) {
    return <span className={baseClass}>{inner}</span>;
  }
  return (
    <Link
      href={`/axis/${axis}`}
      className={`${baseClass} hover:text-foreground transition`}
    >
      {inner}
    </Link>
  );
}
