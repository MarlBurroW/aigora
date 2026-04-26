"use client";

import Link from "next/link";
import { ChevronDown, Scale, Trash2, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CreatorIcon } from "@/components/creator-icon";
import { CREATOR_LABEL, getCreator, shortModelName } from "@/lib/creator";
import { useCompareCart } from "@/lib/compare-cart";
import type { Provider } from "@/lib/types";

/**
 * Floating bottom-right pill that surfaces whatever models the visitor has
 * dropped into their compare cart while browsing. Clicking expands to show
 * the list with remove buttons + a primary "Compare these →" CTA.
 *
 * Auto-hides on /embed/* (no chrome) and on /compare itself (the page is
 * already showing the comparison).
 */
export function CompareCartWidget() {
  const cart = useCompareCart();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!cart.hydrated || cart.items.length === 0) return null;
  if (pathname?.startsWith("/embed/")) return null;
  if (pathname === "/compare") return null;

  return (
    <div
      ref={ref}
      className="fixed bottom-5 right-5 z-50 sm:bottom-6 sm:right-6"
    >
      {open && (
        <div className="mb-2 w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-white/15 bg-zinc-950/95 p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-semibold tracking-tight">
              Comparison cart
            </h3>
            <button
              type="button"
              onClick={cart.clear}
              className="inline-flex items-center gap-1 text-[11px] text-foreground/45 transition hover:text-rose-300"
              title="Empty the cart"
            >
              <Trash2 size={11} />
              clear
            </button>
          </div>
          <p className="mt-0.5 text-xs text-foreground/45">
            {cart.items.length} model{cart.items.length > 1 ? "s" : ""}{" "}
            staged · click to remove
          </p>
          <ul className="mt-3 max-h-72 space-y-1.5 overflow-y-auto pr-1">
            {cart.items.map((item) => {
              const creator = getCreator(
                item.provider as Provider,
                item.modelId,
              );
              const display = shortModelName(
                item.provider as Provider,
                item.modelId,
              );
              return (
                <li key={`${item.provider}/${item.modelId}`}>
                  <button
                    type="button"
                    onClick={() => cart.remove(item.provider, item.modelId)}
                    className="group flex w-full items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-2 text-left text-xs transition hover:border-rose-500/20 hover:bg-rose-500/5"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <CreatorIcon creator={creator} size={14} />
                      <span className="truncate">
                        <span className="font-medium">{display}</span>
                        <span className="ml-1.5 text-foreground/40">
                          {CREATOR_LABEL[creator]}
                        </span>
                      </span>
                    </span>
                    <X
                      size={12}
                      className="text-foreground/30 transition group-hover:text-rose-300"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
          <Link
            href={cart.compareHref}
            onClick={() => setOpen(false)}
            className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.08] px-3 py-2 text-sm font-medium transition hover:bg-white/[0.14]"
            style={{
              boxShadow:
                "inset 0 0 32px -12px var(--brand-blue), 0 0 20px -6px color-mix(in srgb, var(--brand-blue) 35%, transparent)",
            }}
          >
            <Scale size={14} className="text-[var(--brand-blue)]" />
            Compare {cart.items.length === 1 ? "this model" : "these models"} →
          </Link>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 rounded-full border border-white/15 bg-zinc-950/85 py-2.5 pl-3 pr-3.5 text-sm shadow-2xl backdrop-blur-xl transition hover:bg-zinc-900"
        style={{
          boxShadow:
            "0 0 24px -6px color-mix(in srgb, var(--brand-blue) 35%, transparent), 0 8px 30px rgba(0,0,0,0.4)",
        }}
        aria-expanded={open}
      >
        <span
          className="grid size-7 place-items-center rounded-full"
          style={{
            background:
              "linear-gradient(135deg, var(--brand-blue), var(--brand-green))",
          }}
        >
          <Scale size={14} className="text-white" />
        </span>
        <span className="font-medium">
          {cart.items.length} in comparison
        </span>
        <ChevronDown
          size={14}
          className={`text-foreground/55 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
    </div>
  );
}
