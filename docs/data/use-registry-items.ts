"use client";

import { useEffect, useState } from "react";
import { getRegistryItems } from "@/data/registry";
import type { RegistryItem } from "@/types/registry";

export function useRegistryItems() {
  const [items, setItems] = useState<RegistryItem[] | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getRegistryItems()
      .then((next) => {
        if (!cancelled) setItems(next);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load registry");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { items, error };
}
