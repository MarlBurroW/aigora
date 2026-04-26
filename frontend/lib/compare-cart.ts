"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "aigora.compare.v1";

export type CartItem = { provider: string; modelId: string };

const same = (a: CartItem, b: CartItem) =>
  a.provider === b.provider && a.modelId === b.modelId;

function readStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (i): i is CartItem =>
          typeof i?.provider === "string" && typeof i?.modelId === "string",
      )
      .slice(0, 20); // hard cap, defensive
  } catch {
    return [];
  }
}

function writeStorage(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* storage full / disabled */
  }
}

/**
 * "Cart" of models the visitor wants to compare. Persists across page
 * navigations via localStorage and stays in sync between tabs through
 * the `storage` event.
 */
export function useCompareCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readStorage());
    setHydrated(true);

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(readStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const has = useCallback(
    (provider: string, modelId: string) =>
      items.some((i) => same(i, { provider, modelId })),
    [items],
  );

  const add = useCallback((item: CartItem) => {
    setItems((prev) => {
      if (prev.some((i) => same(i, item))) return prev;
      const next = [...prev, item];
      writeStorage(next);
      return next;
    });
  }, []);

  const remove = useCallback((provider: string, modelId: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => !same(i, { provider, modelId }));
      writeStorage(next);
      return next;
    });
  }, []);

  const toggle = useCallback(
    (item: CartItem) => {
      if (has(item.provider, item.modelId)) {
        remove(item.provider, item.modelId);
      } else {
        add(item);
      }
    },
    [has, add, remove],
  );

  const clear = useCallback(() => {
    setItems([]);
    writeStorage([]);
  }, []);

  /** Build a `/compare?models=…` URL from the cart. */
  const compareHref = items.length
    ? "/compare?" +
      items.map((i) => `models=${i.provider}/${i.modelId}`).join("&")
    : "/compare";

  return { items, hydrated, has, add, remove, toggle, clear, compareHref };
}
