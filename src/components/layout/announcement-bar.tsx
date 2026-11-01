import { getStoreSettings } from "@/lib/data/settings";

export async function AnnouncementBar() {
  const settings = await getStoreSettings();
  if (!settings.announcementEnabled || !settings.announcementText) return null;

  return (
    <div className="bg-slate-950 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-100">
      {settings.announcementText}
    </div>
  );
}

export function AnnouncementBarSkeleton() {
  return <div className="h-7 bg-gold/30" />;
}
