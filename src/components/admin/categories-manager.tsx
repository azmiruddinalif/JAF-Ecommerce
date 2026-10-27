"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CategoryForm } from "./category-form";
import { deleteCategoryAction, toggleCategoryEnabledAction } from "@/lib/actions/admin-category-actions";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  displayOrder: number;
  enabled: boolean;
  imageUrl: string | null;
  productCount: number;
}

export function CategoriesManager({ categories }: { categories: CategoryRow[] }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function remove(id: string) {
    if (!confirm("Delete this category? This can't be undone.")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteCategoryAction(id);
      if (!result.success) setError(result.message);
    });
  }

  function toggleEnabled(id: string) {
    startTransition(async () => {
      await toggleCategoryEnabledAction(id);
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl">CATEGORIES</h1>
        <Button variant="primary" onClick={() => setAdding((v) => !v)}>
          <Plus size={16} /> {adding ? "CLOSE" : "ADD CATEGORY"}
        </Button>
      </div>

      {error && <p className="mb-4 border border-danger/40 bg-danger/10 px-4 py-2 text-sm text-danger">{error}</p>}

      {adding && (
        <div className="mb-8 border border-ink-border bg-ink-raised p-6">
          <CategoryForm onDone={() => setAdding(false)} />
        </div>
      )}

      <div className="divide-y divide-ink-border border border-ink-border">
        {categories.length === 0 && <p className="px-5 py-8 text-center text-sm text-paper-dim">No categories yet.</p>}
        {categories.map((category) => (
          <div key={category.id} className={isPending ? "opacity-70" : ""}>
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden bg-ink-raised">
                {category.imageUrl && (
                  <Image src={category.imageUrl} alt={category.name} fill sizes="48px" className="object-cover" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{category.name}</p>
                <p className="text-xs text-paper-dim">
                  /{category.slug} · {category.productCount} products
                </p>
              </div>
              <Badge variant={category.enabled ? "success" : "neutral"}>
                {category.enabled ? "Enabled" : "Disabled"}
              </Badge>
              <button
                type="button"
                onClick={() => toggleEnabled(category.id)}
                className="text-xs uppercase tracking-wider text-paper-dim hover:text-gold"
              >
                Toggle
              </button>
              <button
                type="button"
                onClick={() => setEditingId(editingId === category.id ? null : category.id)}
                aria-label="Edit category"
                className="text-paper-dim hover:text-gold"
              >
                <Pencil size={16} />
              </button>
              <button
                type="button"
                onClick={() => remove(category.id)}
                aria-label="Delete category"
                className="text-paper-dim hover:text-danger"
              >
                <Trash2 size={16} />
              </button>
            </div>
            {editingId === category.id && (
              <div className="border-t border-ink-border bg-ink-raised p-6">
                <CategoryForm category={category} onDone={() => setEditingId(null)} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
