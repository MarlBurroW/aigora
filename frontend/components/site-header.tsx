import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { SITE } from "@/lib/site";

const NAV = [
  { href: "/", label: "Models" },
  { href: "/axes", label: "Axes" },
  { href: "/compare", label: "Compare" },
  { href: "/ranking", label: "Ranking" },
  { href: "/methodology", label: "Methodology" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <BrandMark size={28} className="shrink-0" />
          <span className="text-lg font-semibold tracking-tight">
            {SITE.name}
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-foreground/70 transition hover:bg-white/5 hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
