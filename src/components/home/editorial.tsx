import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getStoreSettings } from "@/lib/data/settings";

export async function Editorial() {
  const settings = await getStoreSettings();

  return (
    <section className="grid grid-cols-1 border-y border-ink-border md:grid-cols-2">
      <div className="flex flex-col justify-center gap-6 bg-ink-raised px-8 py-20 sm:px-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-gold">
          {settings.editorialEyebrow}
        </p>
        <h2 className="whitespace-pre-line font-display text-4xl leading-tight sm:text-5xl">
          {settings.editorialHeading}
        </h2>
        <p className="max-w-md text-sm text-paper/70">
          {settings.editorialBody}
        </p>
        <Link href="/shop">
          <Button variant="outline" size="lg">
            {settings.editorialCtaLabel}
          </Button>
        </Link>
      </div>
      <div className="relative min-h-80 bg-linear-to-br from-ink via-ink-raised to-gold-dim/30 md:min-h-full">
        {settings.editorialImageUrl && (
          <Image
            src={settings.editorialImageUrl}
            alt={settings.editorialHeading}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        )}
      </div>
    </section>
  );
}

export function EditorialSkeleton() {
  return (
    <div className="h-120 animate-pulse border-y border-ink-border bg-ink-raised" />
  );
}
