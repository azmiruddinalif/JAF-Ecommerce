import { getStoreSettings } from "@/lib/data/settings";

export async function AnnouncementBar() {
  const settings = await getStoreSettings();
  if (!settings.announcementEnabled || !settings.announcementText) return null;

  return (
    <div className="bg-gold-bright py-2 text-center text-[11px] font-semibold uppercase tracking-widest text-ink">
      {settings.announcementText}
    </div>
  );
}

export function AnnouncementBarSkeleton() {
  return <div className="h-7 bg-gold/30" />;
}
