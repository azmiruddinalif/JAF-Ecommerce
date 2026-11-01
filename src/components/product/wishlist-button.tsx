"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Heart } from "lucide-react";

const STORAGE_KEY = "jaf_wishlist";
const listeners = new Set<() => void>();

function readWishlist(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeWishlist(ids: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Storage may be unavailable (private mode); fail silently.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function WishlistButton({ productId }: { productId: string }) {
  const getSnapshot = useCallback(() => (readWishlist().includes(productId) ? "saved" : "unsaved"), [productId]);
  const isSaved = useSyncExternalStore(subscribe, getSnapshot, () => "unsaved") === "saved";

  function toggle() {
    const current = readWishlist();
    const next = current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId];
    writeWishlist(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isSaved}
      aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
      className={`flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl border transition-colors ${
        isSaved
          ? "border-amber-400 bg-amber-50 text-amber-500"
          : "border-slate-300 bg-white text-slate-700 hover:border-slate-950 hover:text-slate-950 shadow-2xs"
      }`}
    >
      <Heart size={16} fill={isSaved ? "currentColor" : "none"} />
    </button>
  );
}
