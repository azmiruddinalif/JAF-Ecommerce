import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getStoreSettings } from "@/lib/data/settings";

export async function FinalCta() {
  const settings = await getStoreSettings();

  return (
    <section className="relative overflow-hidden bg-ink-raised px-4 py-24 text-center sm:px-6 lg:px-8">
      {settings.finalCtaImageUrl && (
        <>
          <Image
            src={settings.finalCtaImageUrl}
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-linear-to-t from-ink via-ink/60 to-ink/30" />
        </>
      )}
      <div className="relative z-10">
        <h2 className="font-display text-4xl leading-tight sm:text-6xl">
          {settings.finalCtaHeadingLine1}
          <br />
          <span className="text-gold">{settings.finalCtaHeadingLine2}</span>
        </h2>
        <div className="mt-8">
          <Link href="/shop">
            <Button variant="primary" size="lg">
              {settings.finalCtaButtonLabel}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export function FinalCtaSkeleton() {
  return <div className="h-80 animate-pulse bg-ink-raised" />;
}
