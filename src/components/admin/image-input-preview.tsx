"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";

export function ImageInputWithPreview({
  id,
  name,
  currentUrl,
  alt,
  removeName,
  boxClassName = "h-20 w-28",
  wrapperClassName = "flex items-center gap-4",
}: {
  id: string;
  name: string;
  currentUrl?: string | null;
  alt: string;
  removeName?: string;
  boxClassName?: string;
  wrapperClassName?: string;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  // Revoke the previous object URL whenever the selection changes or the
  // field unmounts, so picking several files in a row doesn't leak memory.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const displayUrl = preview ?? currentUrl ?? null;

  return (
    <div className={wrapperClassName}>
      <div className={`relative shrink-0 overflow-hidden border border-ink-border bg-ink ${boxClassName}`}>
        {displayUrl ? (
          <Image
            src={displayUrl}
            alt={alt}
            fill
            sizes="200px"
            className="object-cover"
            unoptimized={!!preview}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] text-paper-dim">No image</div>
        )}
      </div>
      <div className="flex w-full flex-col gap-2">
        <input
          id={id}
          name={name}
          type="file"
          accept="image/*"
          className="w-full text-xs text-paper-dim file:mr-2 file:border file:border-ink-border file:bg-ink-raised file:px-2 file:py-1 file:text-xs"
          onChange={(e) => {
            const file = e.target.files?.[0];
            setPreview(file ? URL.createObjectURL(file) : null);
          }}
        />
        {currentUrl && removeName && (
          <label className="flex items-center gap-2 text-xs text-paper-dim">
            <Checkbox name={removeName} />
            Remove this image
          </label>
        )}
      </div>
    </div>
  );
}
