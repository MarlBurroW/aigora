"use client";

import { Search, X } from "lucide-react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
};

/** Reusable search input with magnifier + clear button. */
export function SearchableInput({
  value,
  onChange,
  placeholder = "Search…",
  className = "",
}: Props) {
  return (
    <div className={`relative ${className}`}>
      <Search
        size={14}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-9 text-sm transition placeholder:text-foreground/40 focus:border-white/25 focus:bg-white/[0.08] focus:outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-foreground/50 transition hover:bg-white/5 hover:text-foreground"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
