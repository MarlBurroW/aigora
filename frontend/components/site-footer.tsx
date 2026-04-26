import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { SITE } from "@/lib/site";

const NAV_LINKS = [
  { href: "/", label: "Models" },
  { href: "/compare", label: "Compare" },
  { href: "/ranking", label: "Ranking" },
  { href: "/methodology", label: "Methodology" },
  { href: "/about", label: "About" },
];

const FEATURED_AXES = [
  { axis: "communism", label: "Communism" },
  { axis: "capitalism", label: "Capitalism" },
  { axis: "progressive", label: "Progressive" },
  { axis: "internationalism", label: "Internationalism" },
  { axis: "feminism", label: "Feminism" },
  { axis: "ecology", label: "Ecology" },
];

const RESOURCES = [
  {
    href: "https://github.com/MarlBurroW/aigora",
    label: "Source code",
    external: true,
  },
  {
    href: "https://politiscales.fr/",
    label: "Politiscales test",
    external: true,
  },
  {
    href: "https://github.com/Conobi/politiscales",
    label: "Upstream repo",
    external: true,
  },
  {
    href: `https://x.com/${SITE.twitterHandle.replace(/^@/, "")}`,
    label: `Follow ${SITE.twitterHandle}`,
    external: true,
  },
];

export function SiteFooter() {
  const year = new Date().getUTCFullYear();
  return (
    <footer className="mt-20 border-t border-white/5 bg-background/40">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Brand column */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 group"
            >
              <BrandMark size={32} className="shrink-0" />
              <span className="text-lg font-semibold tracking-tight">
                {SITE.name}
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-foreground/55 leading-relaxed">
              {SITE.tagline}. Reproducible, versioned, fully transparent.
            </p>
          </div>

          {/* Navigation */}
          <FooterColumn title="Navigate" links={NAV_LINKS} />

          {/* Axis quick links */}
          <FooterColumn
            title="Browse axes"
            links={[
              ...FEATURED_AXES.map((a) => ({
                href: `/axis/${a.axis}`,
                label: a.label,
              })),
              { href: "/axes", label: "View all 23 →" },
            ]}
          />

          {/* External resources */}
          <FooterColumn title="Resources" links={RESOURCES} />
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 text-xs text-foreground/40 sm:flex-row">
          <p>
            © {year} {SITE.name}
          </p>
          <p className="text-center sm:text-right">
            Quiz courtesy of{" "}
            <a
              href="https://politiscales.fr/"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-foreground/70"
            >
              Politiscales
            </a>{" "}
            · Open source under MIT
          </p>
        </div>
      </div>
    </footer>
  );
}

type FooterLink = {
  href: string;
  label: string;
  external?: boolean;
};

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: FooterLink[];
}) {
  return (
    <div>
      <h3 className="text-xs font-medium uppercase tracking-wider text-foreground/45">
        {title}
      </h3>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map((l) =>
          l.external ? (
            <li key={l.href}>
              <a
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-foreground/70 transition hover:text-foreground"
              >
                {l.label}
                <ArrowUpRight
                  size={11}
                  className="text-foreground/40"
                  aria-hidden
                />
              </a>
            </li>
          ) : (
            <li key={l.href}>
              <Link
                href={l.href}
                className="text-foreground/70 transition hover:text-foreground"
              >
                {l.label}
              </Link>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
