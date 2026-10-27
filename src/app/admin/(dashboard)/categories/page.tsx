import { getAllCategories } from "@/lib/data/categories";
import { CategoriesManager } from "@/components/admin/categories-manager";

export const metadata = { title: "Categories", robots: { index: false } };

export default async function AdminCategoriesPage() {
  const categories = await getAllCategories();

  return (
    <CategoriesManager
      categories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        displayOrder: c.displayOrder,
        enabled: c.enabled,
        imageUrl: c.imageUrl,
        productCount: c._count.products,
      }))}
    />
  );
}
