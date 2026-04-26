"use client";

import { Check, Code2, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";

type Props = {
  provider: string;
  modelId: string;
};

/** "Embed this on your blog" button — opens a popover with the iframe
 *  snippet and a copy-to-clipboard control. */
export function EmbedButton({ provider, modelId }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Build the embed URL using the runtime origin so it works on
  // localhost / preview deploys / production without baking a base URL.
  const [origin, setOrigin] = useState("https://ai-gora.com");
  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  const url = `${origin}/embed/${provider}/${encodeURIComponent(modelId)}`;
  const snippet = `<iframe src="${url}" width="600" height="540" frameborder="0" style="border:0;border-radius:16px;overflow:hidden"></iframe>`;

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

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      track("Embed copied", { model: `${provider}/${modelId}` });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-foreground/75 transition hover:bg-white/10 hover:text-foreground"
      >
        <Code2 size={13} />
        Embed
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(420px,90vw)] rounded-xl border border-white/10 bg-zinc-950/95 p-4 shadow-2xl backdrop-blur-xl">
          <div className="text-xs uppercase tracking-wider text-foreground/55">
            Embed this profile
          </div>
          <p className="mt-1 text-xs text-foreground/55">
            Drop the snippet on a blog or article — the model&apos;s profile
            renders as a self-contained 600×540 widget.
          </p>
          <pre className="mt-3 max-h-40 overflow-auto rounded-lg border border-white/5 bg-black/40 p-3 text-[11px] leading-relaxed text-foreground/80 whitespace-pre-wrap break-all">
            {snippet}
          </pre>
          <div className="mt-3 flex items-center justify-between gap-2">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-foreground/55 underline underline-offset-2 hover:text-foreground/85"
            >
              Preview
            </a>
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-white/[0.12]"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "Copied" : "Copy snippet"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
