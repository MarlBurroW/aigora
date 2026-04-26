"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { useCompareCart } from "@/lib/compare-cart";
import { SITE } from "@/lib/site";

const NAV_LEFT = [
  { href: "/", label: "Models" },
  { href: "/axes", label: "Axes" },
];
const NAV_RIGHT = [
  { href: "/ranking", label: "Ranking" },
  { href: "/methodology", label: "Methodology" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const cart = useCompareCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on every route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Esc closes the mobile menu
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  // Lock body scroll while mobile menu is open
  useEffect(() => {
    if (typeof document === "undefined") return;
    const original = document.body.style.overflow;
    document.body.style.overflow = mobileOpen ? "hidden" : original;
    return () => {
      document.body.style.overflow = original;
    };
  }, [mobileOpen]);

  // Embed routes are intended to live inside a 3rd-party iframe — they must
  // not ship the site chrome.
  if (pathname?.startsWith("/embed/")) return null;

  // The Compare link auto-includes whatever the visitor has staged in their
  // compare cart so navigating from anywhere lands on a populated comparison.
  const compareHref = cart.items.length > 0 ? cart.compareHref : "/compare";
  const cartCount = cart.hydrated ? cart.items.length : 0;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
          onClick={() => setMobileOpen(false)}
        >
          <BrandMark size={28} className="shrink-0" />
          <span className="text-lg font-semibold tracking-tight">
            {SITE.name}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 text-sm">
          {NAV_LEFT.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-foreground/70 transition hover:bg-white/5 hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={compareHref}
            className="relative rounded-md px-3 py-2 text-foreground/70 transition hover:bg-white/5 hover:text-foreground"
          >
            Compare
            {cartCount > 0 && (
              <span
                className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full text-[9px] font-bold text-white"
                style={{
                  background:
                    "linear-gradient(135deg, var(--brand-blue), var(--brand-green))",
                }}
              >
                {cartCount}
              </span>
            )}
          </Link>
          {NAV_RIGHT.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-foreground/70 transition hover:bg-white/5 hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/take-test"
            className="ml-2 inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/[0.06] px-3 py-2 font-medium text-foreground transition hover:bg-white/[0.12]"
            style={{
              boxShadow:
                "inset 0 0 24px -10px var(--brand-blue), 0 0 16px -4px color-mix(in srgb, var(--brand-blue) 30%, transparent)",
            }}
          >
            <Sparkles size={13} className="text-[var(--brand-blue)]" />
            Take the test
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          className="relative inline-flex size-10 items-center justify-center rounded-md text-foreground/80 transition hover:bg-white/5 md:hidden"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          {!mobileOpen && cartCount > 0 && (
            <span
              className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full text-[9px] font-bold text-white"
              style={{
                background:
                  "linear-gradient(135deg, var(--brand-blue), var(--brand-green))",
              }}
            >
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Mobile menu panel */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/5 bg-background/95 backdrop-blur-xl">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-4">
            {/* "Take the test" CTA at the top — primary action */}
            <Link
              href="/take-test"
              className="mb-1 inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.06] px-4 py-3 text-base font-medium text-foreground"
              style={{
                boxShadow:
                  "inset 0 0 28px -10px var(--brand-blue), 0 0 16px -4px color-mix(in srgb, var(--brand-blue) 30%, transparent)",
              }}
            >
              <Sparkles size={16} className="text-[var(--brand-blue)]" />
              Take the test
            </Link>

            {NAV_LEFT.map((item) => (
              <MobileLink
                key={item.href}
                href={item.href}
                active={pathname === item.href}
              >
                {item.label}
              </MobileLink>
            ))}
            <MobileLink
              href={compareHref}
              active={pathname === "/compare"}
              badge={cartCount > 0 ? cartCount : undefined}
            >
              Compare
            </MobileLink>
            {NAV_RIGHT.map((item) => (
              <MobileLink
                key={item.href}
                href={item.href}
                active={pathname === item.href}
              >
                {item.label}
              </MobileLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

function MobileLink({
  href,
  active,
  badge,
  children,
}: {
  href: string;
  active?: boolean;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between rounded-lg px-4 py-3 text-base transition ${
        active
          ? "bg-white/[0.08] text-foreground"
          : "text-foreground/75 hover:bg-white/[0.04] hover:text-foreground"
      }`}
    >
      <span>{children}</span>
      {badge !== undefined && (
        <span
          className="grid min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-bold text-white"
          style={{
            background:
              "linear-gradient(135deg, var(--brand-blue), var(--brand-green))",
          }}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}
