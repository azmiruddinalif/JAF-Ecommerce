import { getStoreSettings } from "@/lib/data/settings";

export async function BrandStatement() {
  const settings = await getStoreSettings();

  return (
    <section className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:px-8">
      <p className="font-serif-italic text-2xl text-gold sm:text-3xl">{settings.brandStatementHeading}</p>
      <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-paper/70 sm:text-base">
        {settings.brandStatementBody}
      </p>
    </section>
  );
}

export function BrandStatementSkeleton() {
  return <div className="mx-auto h-64 max-w-4xl animate-pulse bg-ink-raised" />;
}
