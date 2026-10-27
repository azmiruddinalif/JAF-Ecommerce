import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyCart({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 text-center ${compact ? "py-12" : "py-24"}`}>
      <ShoppingBag className="text-paper-dim" size={40} strokeWidth={1.5} />
      <div>
        <p className="font-display text-lg">YOUR CART IS EMPTY</p>
        <p className="mt-1 text-sm text-paper-dim">Find a jersey that matches your game.</p>
      </div>
      <Link href="/shop">
        <Button variant="primary">SHOP COLLECTION</Button>
      </Link>
    </div>
  );
}
