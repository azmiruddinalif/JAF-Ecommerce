"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import { Plus, Star, Trash2, UploadCloud } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SortableImageGrid } from "@/components/admin/sortable-image-grid";
import { compressImageForUpload, sortFilesNaturally } from "@/lib/image-client";
import {
  addProductImageUrlAction,
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
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Reorders show instantly; the server result replaces this when the action settles.
  const [optimisticImages, setOptimisticImages] = useOptimistic(images);

  function uploadFiles(files: FileList | File[]) {
    setError(null);
    // Serial order: natural filename order (1, 2, 3 … 10), uploaded one after another.
    const fileArray = sortFilesNaturally(
      Array.from(files).filter((f) => f.type.startsWith("image/")),
    );
    if (fileArray.length === 0) return;

    startTransition(async () => {
      setProgress({ done: 0, total: fileArray.length });
      for (let i = 0; i < fileArray.length; i++) {
        const formData = new FormData();
        formData.set("file", await compressImageForUpload(fileArray[i]));
        const result = await uploadProductImageAction(productId, formData);
        if (!result.success) {
          setError(`${fileArray[i].name}: ${result.message}`);
          break;
        }
        setProgress({ done: i + 1, total: fileArray.length });
      }
      setProgress(null);
    });
  }

  function handleAddUrl() {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    setError(null);
    startTransition(async () => {
      const result = await addProductImageUrlAction(productId, trimmed);
      if (!result.success) {
        setError(result.message);
      } else {
        setImageUrlInput("");
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

  function reorder(orderedIds: string[]) {
    const byId = new Map(images.map((img) => [img.id, img]));
    const next = orderedIds
      .map((id, index) => {
        const img = byId.get(id);
        return img ? { ...img, displayOrder: index, isPrimary: index === 0 } : null;
      })
      .filter((img): img is ProductImageRow => img !== null);

    startTransition(async () => {
      setOptimisticImages(next);
      const result = await reorderProductImagesAction(productId, orderedIds);
      if (!result.success) setError(result.message);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        onDragOver={(e) => {
          // Only react to files dragged in from the desktop, not thumbnail re-ordering.
          if (!e.dataTransfer.types.includes("Files")) return;
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          if (!e.dataTransfer.types.includes("Files")) return;
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
        <p className="text-sm text-paper">Drag &amp; drop multiple images here, or click to select many at once</p>
        <p className="text-xs text-paper-dim">
          They upload one after another in file-name order. JPEG, PNG, WEBP or AVIF — large photos are auto-resized.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) uploadFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          value={imageUrlInput}
          onChange={(e) => setImageUrlInput(e.target.value)}
          placeholder="Or paste direct image URL (https://...)"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddUrl();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={handleAddUrl}
          className="shrink-0"
        >
          <Plus size={14} /> ADD IMAGE URL
        </Button>
      </div>

      {error && <p className="border border-danger/40 bg-danger/10 px-4 py-2 text-sm text-danger">{error}</p>}
      {progress ? (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-paper-dim">
            Uploading {Math.min(progress.done + 1, progress.total)} of {progress.total}…
          </p>
          <div className="h-1 w-full bg-ink-border">
            <div
              className="h-full bg-gold-bright transition-all"
              style={{ width: `${(progress.done / progress.total) * 100}%` }}
            />
          </div>
        </div>
      ) : (
        isPending && <p className="text-xs text-paper-dim">Working...</p>
      )}

      {optimisticImages.length > 1 && (
        <p className="text-xs text-paper-dim">
          Drag images to change their order (or use the arrows). The first image is the primary cover photo.
        </p>
      )}

      <SortableImageGrid
        items={optimisticImages.map((img) => ({
          id: img.id,
          url: img.secureUrl,
          alt: img.altText ?? "Product image",
        }))}
        onReorder={reorder}
        disabled={isPending}
        renderActions={(item, index) => (
          <>
            <button
              type="button"
              onClick={() => setPrimary(item.id)}
              aria-label="Set as primary"
              className="p-1 text-paper hover:text-gold-bright"
            >
              <Star size={14} fill={index === 0 ? "currentColor" : "none"} />
            </button>
            <button
              type="button"
              onClick={() => remove(item.id)}
              aria-label="Delete image"
              className="p-1 text-paper hover:text-danger"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      />
    </div>
  );
}
