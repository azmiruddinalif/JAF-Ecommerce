"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Star,
  Trash2,
  Upload,
  UploadCloud,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SortableImageGrid } from "@/components/admin/sortable-image-grid";
import { compressImageForUpload, isImageFile, sortFilesNaturally } from "@/lib/image-client";
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

interface StagedFile {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
}

export function ImageUploader({
  productId,
  images,
}: {
  productId: string;
  images: ProductImageRow[];
}) {
  const [isPending, startTransition] = useTransition();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Staging queue for newly selected multiple files (before clicking Upload)
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{
    done: number;
    total: number;
    currentName: string;
  } | null>(null);
  const isUploading = uploadProgress !== null;

  // Optimistic image gallery for instant reordering of existing images
  const [optimisticImages, setOptimisticImages] = useOptimistic(images);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      stagedFiles.forEach((sf) => URL.revokeObjectURL(sf.previewUrl));
    };
  }, [stagedFiles]);

  // When files are selected from input or drag-and-drop:
  function handleSelectFiles(files: FileList | File[]) {
    setError(null);
    setSuccessMsg(null);
    const valid = sortFilesNaturally(Array.from(files).filter(isImageFile));
    if (valid.length === 0) return;

    const newStaged: StagedFile[] = valid.map((file, idx) => ({
      id: `staged-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
    }));

    setStagedFiles((prev) => [...prev, ...newStaged]);
  }

  // Re-order staged files (swipe/swap which one comes first or last)
  function moveStaged(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= stagedFiles.length) return;
    setStagedFiles((prev) => {
      const copy = [...prev];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  }

  function removeStaged(id: string) {
    setStagedFiles((prev) => {
      const match = prev.find((item) => item.id === id);
      if (match) URL.revokeObjectURL(match.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  }

  // Automatic Serial-by-Serial Upload of all staged files
  async function startSerialUpload() {
    if (stagedFiles.length === 0 || isUploading) return;
    setError(null);
    setSuccessMsg(null);

    const total = stagedFiles.length;
    const failures: string[] = [];
    const filesToUpload = [...stagedFiles];

    for (let i = 0; i < filesToUpload.length; i++) {
      const current = filesToUpload[i];
      setUploadProgress({ done: i, total, currentName: current.name });

      try {
        const prepared = await compressImageForUpload(current.file);
        const formData = new FormData();
        formData.set("file", prepared);

        const result = await uploadProductImageAction(productId, formData);
        if (!result.success) {
          failures.push(`${current.name}: ${result.message}`);
        } else {
          // Remove from staging queue as it finishes
          setStagedFiles((prev) => {
            const filtered = prev.filter((sf) => sf.id !== current.id);
            URL.revokeObjectURL(current.previewUrl);
            return filtered;
          });
        }
      } catch {
        failures.push(`${current.name}: Upload failed (network timeout or size limit).`);
      }
    }

    setUploadProgress(null);

    if (failures.length > 0) {
      setError(`Some images could not be uploaded:\n${failures.join("\n")}`);
    } else {
      setSuccessMsg(`All ${total} images uploaded successfully in serial order!`);
      setTimeout(() => setSuccessMsg(null), 5000);
    }
  }

  // Existing image actions
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

  function removeExisting(id: string) {
    if (!confirm("Delete this image?")) return;
    startTransition(async () => {
      await deleteProductImageAction(id);
    });
  }

  function setPrimaryExisting(id: string) {
    startTransition(async () => {
      await setPrimaryProductImageAction(id);
    });
  }

  function reorderExisting(orderedIds: string[]) {
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
    <div className="flex flex-col gap-6">
      {/* 1. Dropzone to select multiple files at once */}
      <div
        onDragOver={(e) => {
          if (!e.dataTransfer.types.includes("Files")) return;
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          if (!e.dataTransfer.types.includes("Files")) return;
          e.preventDefault();
          setIsDragging(false);
          handleSelectFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 ${
          isDragging
            ? "border-emerald-500 bg-emerald-50/50 shadow-inner"
            : "border-slate-300 bg-white hover:border-emerald-500 hover:bg-slate-50/50"
        }`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-2xs">
          <UploadCloud size={24} />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Click to select multiple images, or drag &amp; drop files here
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Choose as many photos as you want at a time (JPG, PNG, WEBP, AVIF, GIF, HEIC).
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.heic,.heif,.jfif,.avif"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleSelectFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* 2. Staged Queue: Images Chosen but Not Yet Uploaded (Can swipe/reorder) */}
      {stagedFiles.length > 0 && (
        <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/40 p-5 shadow-xs">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-emerald-200/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                  {stagedFiles.length}
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Selected Images to Upload (Review &amp; Reorder)
                </h3>
              </div>
              <p className="mt-0.5 text-xs text-slate-600">
                Arrange the order below (first image will be primary). When ready, click Upload to upload automatically serial by serial.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={isUploading}
                onClick={startSerialUpload}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              >
                <Upload size={14} />
                <span>
                  {isUploading
                    ? "Uploading..."
                    : `Upload All ${stagedFiles.length} Images (Serial)`}
                </span>
              </Button>
              <button
                type="button"
                disabled={isUploading}
                onClick={() => {
                  stagedFiles.forEach((sf) => URL.revokeObjectURL(sf.previewUrl));
                  setStagedFiles([]);
                }}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Upload Progress Bar */}
          {uploadProgress && (
            <div className="mt-4 rounded-xl border border-emerald-300 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-2">
                <span className="flex items-center gap-2 text-emerald-700 font-semibold">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  Uploading {uploadProgress.done + 1} of {uploadProgress.total}: &ldquo;{uploadProgress.currentName}&rdquo;
                </span>
                <span className="font-mono text-slate-500">
                  {Math.round(((uploadProgress.done) / uploadProgress.total) * 100)}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full bg-emerald-600 transition-all duration-300"
                  style={{
                    width: `${((uploadProgress.done) / uploadProgress.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Staged Thumbnails with Order Numbers and Reorder Controls */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {stagedFiles.map((item, index) => (
              <div
                key={item.id}
                className="group relative aspect-square overflow-hidden rounded-xl border border-emerald-300/80 bg-white shadow-xs"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.previewUrl}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />

                {/* Serial Position Tag */}
                <span className="absolute left-2 top-2 rounded-md bg-emerald-700 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                  {index === 0 ? "1 · Primary" : `#${index + 1}`}
                </span>

                {/* Controls overlay */}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-slate-900/85 p-1.5 backdrop-blur-xs">
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      disabled={isUploading || index === 0}
                      onClick={() => moveStaged(index, -1)}
                      title="Move Left"
                      aria-label="Move left"
                      className="rounded p-1 text-slate-200 hover:bg-white/20 hover:text-white disabled:opacity-20"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      disabled={isUploading || index === stagedFiles.length - 1}
                      onClick={() => moveStaged(index, 1)}
                      title="Move Right"
                      aria-label="Move right"
                      className="rounded p-1 text-slate-200 hover:bg-white/20 hover:text-white disabled:opacity-20"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => removeStaged(item.id)}
                    title="Remove from queue"
                    aria-label="Remove from queue"
                    className="rounded p-1 text-slate-300 hover:bg-rose-500 hover:text-white"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-xs">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800 shadow-xs whitespace-pre-line">
          {error}
        </div>
      )}

      {/* 3. Existing Images Gallery */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Live Product Gallery ({optimisticImages.length} Images)
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Swipe or drag to reorder. The first image (#1) is automatically used as the cover photo on product cards.
            </p>
          </div>
        </div>

        {optimisticImages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-xs text-slate-400">
            No images uploaded yet. Select images above to add photos.
          </div>
        ) : (
          <SortableImageGrid
            items={optimisticImages.map((img) => ({
              id: img.id,
              url: img.secureUrl,
              alt: img.altText ?? "Product image",
            }))}
            onReorder={reorderExisting}
            disabled={isPending || isUploading}
            renderActions={(item, index) => (
              <>
                <button
                  type="button"
                  onClick={() => setPrimaryExisting(item.id)}
                  title="Make Primary Cover"
                  aria-label="Set as primary"
                  className="rounded p-1 text-slate-200 hover:bg-white/20 hover:text-amber-300"
                >
                  <Star size={14} fill={index === 0 ? "currentColor" : "none"} className={index === 0 ? "text-amber-400" : ""} />
                </button>
                <button
                  type="button"
                  onClick={() => removeExisting(item.id)}
                  title="Delete image"
                  aria-label="Delete image"
                  className="rounded p-1 text-slate-200 hover:bg-rose-500 hover:text-white"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          />
        )}

        {/* Direct Image URL input */}
        <div className="mt-6 border-t border-slate-200/80 pt-4">
          <label htmlFor="directImageUrl" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Or Paste Direct Image URL (Unsplash / External)
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              id="directImageUrl"
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="bg-slate-50 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddUrl();
                }
              }}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isPending || isUploading}
              onClick={handleAddUrl}
              className="shrink-0"
            >
              <Plus size={14} /> Add URL
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
