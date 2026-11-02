"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AdminError boundary caught]:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-none border border-red-500/30 bg-red-950/20 p-8 text-center text-slate-100">
      <h2 className="font-display text-2xl text-red-400">ADMIN ERROR OCCURRED</h2>
      <p className="max-w-md text-xs text-slate-300">
        {error.message || "An unexpected error occurred in the admin panel. Your data is safe."}
      </p>
      {error.digest && (
        <p className="font-mono text-[10px] text-slate-500">
          Digest: {error.digest}
        </p>
      )}
      <div className="flex items-center gap-3 mt-2">
        <Button variant="primary" size="sm" onClick={reset}>
          TRY AGAIN
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
        >
          RELOAD PAGE
        </Button>
      </div>
    </div>
  );
}

