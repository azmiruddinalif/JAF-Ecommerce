"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, Star, Trash2, UploadCloud } from "lucide-react";
import {
  deleteProductImageAction,
  reorderProductImagesAction,
  setPrimaryProductImageAction,
  uploadProductImageAction,
} from "@/lib/actions/admin-image-actions";

export interface ProductImageRow {
  id: string;
  secureUrl: string;
  altText: string | null;
  displayOrder: number;
  isPrimary: boolean;
}

export function ImageUploader({ productId, images }: { productId: string; images: ProductImageRow[] }) {
  const [isPending, startTransition] = useTransition();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function uploadFiles(files: FileList | File[]) {
    setError(null);
    const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (fileArray.length === 0) return;

    startTransition(async () => {
      for (const file of fileArray) {
        const formData = new FormData();
        formData.set("file", file);
        const result = await uploadProductImageAction(productId, formData);
        if (!result.success) {
          setError(result.message);
          break;
        }
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteProductImageAction(id);
    });
  }

  function setPrimary(id: string) {
    startTransition(async () => {
      await setPrimaryProductImageAction(id);
    });
  }

  function move(index: number, direction: -1 | 1) {
    const next = [...images];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= next.length) return;
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    startTransition(async () => {
      await reorderProductImagesAction(productId, next.map((img) => img.id));
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          uploadFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center gap-2 border-2 border-dashed p-10 text-center transition-colors ${
          isDragging ? "border-gold bg-gold/10" : "border-ink-border hover:border-gold/60"
        }`}
      >
        <UploadCloud size={28} className="text-gold" />
        <p className="text-sm text-paper">Drag & drop images here, or click to browse</p>
        <p className="text-xs text-paper-dim">JPEG, PNG, WEBP or AVIF — up to 8MB each</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
      </div>

      {error && <p className="border border-danger/40 bg-danger/10 px-4 py-2 text-sm text-danger">{error}</p>}
      {isPending && <p className="text-xs text-paper-dim">Working...</p>}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {images.map((image, index) => (
          <div key={image.id} className="group relative aspect-square overflow-hidden border border-ink-border">
            <Image src={image.secureUrl} alt={image.altText ?? "Product image"} fill sizes="200px" className="object-cover" />
            {image.isPrimary && (
              <span className="absolute left-1 top-1 bg-gold-bright px-2 py-0.5 text-[10px] font-semibold uppercase text-ink">
                Primary
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-paper/85 py-1.5 opacity-0 transition-opacity group-hover:opacity-100">
              <button type="button" onClick={() => move(index, -1)} aria-label="Move left" className="p-1 text-ink hover:text-gold-bright">
                <ArrowUp size={14} className="-rotate-90" />
              </button>
              <button type="button" onClick={() => setPrimary(image.id)} aria-label="Set as primary" className="p-1 text-ink hover:text-gold-bright">
                <Star size={14} fill={image.isPrimary ? "currentColor" : "none"} />
              </button>
              <button type="button" onClick={() => move(index, 1)} aria-label="Move right" className="p-1 text-ink hover:text-gold-bright">
                <ArrowDown size={14} className="-rotate-90" />
              </button>
              <button type="button" onClick={() => remove(image.id)} aria-label="Delete image" className="p-1 text-ink hover:text-danger">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
