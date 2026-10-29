import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page Not Found",
  description:
    "The football jersey or page you are looking for could not be found. Browse the full JAF collection of club, national team, and retro football kits.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-display text-6xl text-gold">404</p>
      <h1 className="font-display text-2xl">PAGE NOT FOUND</h1>
      <p className="max-w-sm text-sm text-paper-dim">
        The jersey or page you&apos;re looking for doesn&apos;t exist or has moved off the pitch. Explore our latest club, national team, and retro football kits in the shop.
      </p>
      <Link href="/shop">
        <Button variant="primary">BACK TO SHOP</Button>
      </Link>
    </div>
  );
}
