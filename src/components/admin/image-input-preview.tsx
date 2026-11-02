"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AlertTriangle } from "lucide-react";
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
  const [imageError, setImageError] = useState(false);

  // Revoke the previous object URL whenever the selection changes or the
  // field unmounts, so picking several files in a row doesn't leak memory.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // Reset error when preview or currentUrl changes
  useEffect(() => {
    setImageError(false);
  }, [preview, currentUrl]);

  const displayUrl = preview ?? currentUrl ?? null;
  const isWebpageUrl =
    typeof displayUrl === "string" && displayUrl.includes("unsplash.com/photos/");

  return (
    <div className={wrapperClassName}>
      <div className={`relative shrink-0 overflow-hidden border border-ink-border bg-ink ${boxClassName}`}>
        {displayUrl && !imageError && !isWebpageUrl ? (
          <Image
            src={displayUrl}
            alt={alt}
            fill
            sizes="200px"
            className="object-cover"
            onError={() => setImageError(true)}
            unoptimized={
              !!preview ||
              (typeof displayUrl === "string" &&
                !displayUrl.includes("res.cloudinary.com") &&
                !displayUrl.startsWith("/"))
            }
          />
        ) : isWebpageUrl || imageError ? (
          <div className="flex h-full w-full flex-col items-center justify-center p-2 text-center bg-ink-raised border border-amber-500/30">
            <AlertTriangle size={16} className="text-amber-400 mb-1" />
            <span className="text-[10px] font-bold text-amber-300 leading-tight">
              {isWebpageUrl ? "Webpage Link Detected" : "Preview Failed"}
            </span>
            <span className="text-[9px] text-paper-dim leading-tight mt-0.5">
              {isWebpageUrl
                ? "Upload file or use direct image address"
                : "Invalid or blocked image URL"}
            </span>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] text-paper-dim">No image</div>
        )}
      </div>
      <div className="flex w-full flex-col gap-2">
        <input
          id={id}
          name={name}
          type="file"
          accept="image/*,image/jpeg,image/png,image/webp,image/avif"
          className="w-full text-xs text-paper-dim file:mr-2 file:border file:border-ink-border file:bg-ink-raised file:px-2 file:py-1 file:text-xs cursor-pointer"
          onChange={(e) => {
            const file = e.target.files?.[0];
            setPreview(file ? URL.createObjectURL(file) : null);
            setImageError(false);
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
