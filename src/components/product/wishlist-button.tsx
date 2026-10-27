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
      className={`flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center border transition-colors ${
        isSaved ? "border-gold text-gold" : "border-ink-border text-paper hover:border-gold hover:text-gold"
      }`}
    >
      <Heart size={18} fill={isSaved ? "currentColor" : "none"} />
    </button>
  );
}
