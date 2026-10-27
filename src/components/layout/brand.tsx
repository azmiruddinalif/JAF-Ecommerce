import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

export function Brand({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-8",
    md: "h-10 sm:h-12",
    lg: "h-14 sm:h-20",
  }[size];

  return (
    <Link href="/" className={cn("group inline-flex flex-col leading-none", className)} aria-label="JAF home">
      <Image
        src="/logo-mark.png"
        alt="JAF"
        width={1132}
        height={951}
        priority
        className={cn("w-auto transition-opacity group-hover:opacity-80", sizeClasses)}
      />
    </Link>
  );
}

export function BrandSlogan({ className }: { className?: string }) {
  return (
    <p className={cn("font-serif-italic text-gold", className)}>WE ARE THE ION TO FASHION</p>
  );
}
