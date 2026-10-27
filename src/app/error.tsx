"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-display text-2xl">SOMETHING WENT WRONG</h1>
      <p className="max-w-sm text-sm text-paper-dim">
        We hit an unexpected error. Please try again.
      </p>
      <Button variant="primary" onClick={reset}>
        TRY AGAIN
      </Button>
    </div>
  );
}
