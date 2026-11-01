"use client";

import { useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, GripVertical } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SortableImageItem {
  id: string;
  url: string;
  alt?: string;
}

/**
 * Image thumbnails that can be re-ordered by dragging (desktop) or with the
 * always-visible left/right buttons (touch). The first image is the primary one.
 * `onReorder` receives the full list of ids in their new order.
 */
export function SortableImageGrid({
  items,
  onReorder,
  renderActions,
  className,
  disabled = false,
}: {
  items: SortableImageItem[];
  onReorder: (orderedIds: string[]) => void;
  renderActions?: (item: SortableImageItem, index: number) => ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  // Live order while a drag is in progress; committed on drop.
  const [dragOrder, setDragOrder] = useState<string[] | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const draggingRef = useRef<string | null>(null);

  const byId = new Map(items.map((item) => [item.id, item]));
  const shown: SortableImageItem[] = dragOrder
    ? dragOrder.map((id) => byId.get(id)).filter((i): i is SortableImageItem => Boolean(i))
    : items;

  function handleDragEnter(targetId: string) {
    const fromId = draggingRef.current;
    if (!fromId || fromId === targetId) return;
    setDragOrder((prev) => {
      const order = prev ?? items.map((i) => i.id);
      const from = order.indexOf(fromId);
      const to = order.indexOf(targetId);
      if (from < 0 || to < 0) return order;
      const next = [...order];
      next.splice(from, 1);
      next.splice(to, 0, fromId);
      return next;
    });
  }

  function finishDrag() {
    if (!draggingRef.current) return; // drop + dragend both fire; commit once
    const finalOrder = dragOrder;
    draggingRef.current = null;
    setDraggingId(null);
    setDragOrder(null);
    if (!finalOrder) return;
    const original = items.map((i) => i.id);
    if (finalOrder.some((id, i) => id !== original[i])) onReorder(finalOrder);
  }

  function step(index: number, direction: -1 | 1) {
    const ids = items.map((i) => i.id);
    const target = index + direction;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    onReorder(ids);
  }

  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5", className)}>
      {shown.map((item, index) => (
        <div
          key={item.id}
          draggable={!disabled}
          onDragStart={(e) => {
            draggingRef.current = item.id;
            setDraggingId(item.id);
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", item.id);
          }}
          onDragEnter={() => handleDragEnter(item.id)}
          onDragOver={(e) => {
            if (draggingRef.current) e.preventDefault();
          }}
          onDrop={(e) => {
            e.preventDefault();
            finishDrag();
          }}
          onDragEnd={finishDrag}
          className={cn(
            "group relative aspect-square select-none overflow-hidden border border-ink-border bg-ink transition-all",
            !disabled && "cursor-grab active:cursor-grabbing",
            draggingId === item.id && "scale-95 border-gold opacity-50",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.url}
            alt={item.alt ?? `Image ${index + 1}`}
            draggable={false}
            className="pointer-events-none h-full w-full object-cover"
          />

          <span
            className={cn(
              "absolute left-1.5 top-1.5 flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold uppercase",
              index === 0 ? "bg-gold-bright text-ink" : "bg-ink/85 text-paper",
            )}
          >
            <GripVertical size={10} />
            {index === 0 ? "1 · Primary" : index + 1}
          </span>

          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-ink/85 px-1 py-1">
            <div className="flex items-center">
              <button
                type="button"
                disabled={disabled || index === 0}
                onClick={() => step(index, -1)}
                aria-label="Move earlier"
                className="p-1 text-paper hover:text-gold-bright disabled:opacity-30"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                disabled={disabled || index === shown.length - 1}
                onClick={() => step(index, 1)}
                aria-label="Move later"
                className="p-1 text-paper hover:text-gold-bright disabled:opacity-30"
              >
                <ChevronRight size={15} />
              </button>
            </div>
            <div className="flex items-center gap-0.5">{renderActions?.(item, index)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
