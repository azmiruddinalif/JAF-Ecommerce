import { Suspense } from "react";
import { getAllCustomPages } from "@/lib/data/pages";
import { PagesManager } from "@/components/admin/pages-manager";

export const metadata = { title: "Site Pages", robots: { index: false } };
export const instant = false;

async function PagesEditorLoader() {
  const pages = await getAllCustomPages();
  return <PagesManager pages={pages} />;
}

export default function AdminPagesPage() {
  return (
    <Suspense fallback={<div className="h-96 max-w-4xl animate-pulse bg-ink-raised" />}>
      <PagesEditorLoader />
    </Suspense>
  );
}
