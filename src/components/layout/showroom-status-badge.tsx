"use client";

import { useEffect, useState } from "react";
import {
  type ShowroomScheduleConfig,
  DEFAULT_SHOWROOM_SCHEDULE,
  getStoreStatus,
  type StoreStatusResult,
} from "@/lib/data/settings-shared";

interface ShowroomStatusBadgeProps {
  schedule?: ShowroomScheduleConfig;
  fallbackHours?: string;
  className?: string;
}

export function ShowroomStatusBadge({
  schedule = DEFAULT_SHOWROOM_SCHEDULE,
  fallbackHours,
  className = "",
}: ShowroomStatusBadgeProps) {
  // Initialize with the evaluated store status
  const [status, setStatus] = useState<StoreStatusResult>(() =>
    getStoreStatus(schedule)
  );

  useEffect(() => {
    // Re-evaluate on mount to ensure user client time sync
    setStatus(getStoreStatus(schedule));

    // Poll every 30 seconds to react to opening/closing clock ticks
    const interval = setInterval(() => {
      setStatus(getStoreStatus(schedule));
    }, 30000);

    return () => clearInterval(interval);
  }, [schedule]);

  if (status.badgeVariant === "open") {
    return (
      <span
        title={fallbackHours ? `Store Hours: ${fallbackHours}` : undefined}
        className={`inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[11px] font-semibold text-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.15)] transition-all ${className}`}
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
        <span>{status.statusText}</span>
      </span>
    );
  }

  if (status.badgeVariant === "maintenance") {
    return (
      <span
        title="Showroom status set to temporarily inactive by store admin"
        className={`inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 font-mono text-[11px] font-semibold text-rose-300 transition-all ${className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
        <span>{status.statusText}</span>
      </span>
    );
  }

  return (
    <span
      title={fallbackHours ? `Regular Hours: ${fallbackHours}` : undefined}
      className={`inline-flex items-center gap-2 rounded-full border border-ink-border bg-ink-raised/90 px-3 py-1 font-mono text-[11px] font-medium text-paper-dim transition-all ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-paper-dim/60" />
      <span>{status.statusText}</span>
    </span>
  );
}
