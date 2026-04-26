"use client";

import { Check, Plus } from "lucide-react";
import { track } from "@/lib/analytics";
import { useCompareCart } from "@/lib/compare-cart";

type Props = {
  provider: string;
  modelId: string;
};

/** Toggle button on the model detail page: adds/removes the current model
 *  from the compare cart. */
export function AddToCompareButton({ provider, modelId }: Props) {
  const cart = useCompareCart();
  const inCart = cart.has(provider, modelId);

  return (
    <button
      type="button"
      onClick={() => {
        // Only track ADDS — removing is noise that doesn't tell us anything
        // useful about the share-funnel.
        if (!inCart) {
          track("Add to compare", { model: `${provider}/${modelId}` });
        }
        cart.toggle({ provider, modelId });
      }}
      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition ${
        inCart
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15"
          : "border-white/15 bg-white/[0.06] text-foreground hover:bg-white/[0.12]"
      }`}
      style={
        inCart
          ? undefined
          : {
              boxShadow:
                "inset 0 0 24px -10px var(--brand-blue), 0 0 16px -4px color-mix(in srgb, var(--brand-blue) 30%, transparent)",
            }
      }
    >
      {inCart ? (
        <>
          <Check size={13} className="text-emerald-300" />
          In comparison
        </>
      ) : (
        <>
          <Plus size={13} className="text-[var(--brand-blue)]" />
          Add to compare
        </>
      )}
    </button>
  );
}
