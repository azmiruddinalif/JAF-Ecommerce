/* eslint-disable react-hooks/set-state-in-effect */
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
    getStoreStatus(schedule),
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
        className={`inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 font-mono text-[11px] font-semibold text-emerald-800 transition-all ${className}`}
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
        <span>{status.statusText}</span>
      </span>
    );
  }

  if (status.badgeVariant === "maintenance") {
    return (
      <span
        title="Showroom status set to temporarily inactive by store admin"
        className={`inline-flex items-center gap-2 rounded-full border border-rose-300 bg-rose-50 px-3 py-1 font-mono text-[11px] font-semibold text-rose-700 transition-all ${className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
        <span>{status.statusText}</span>
      </span>
    );
  }

  return (
    <span
      title={fallbackHours ? `Regular Hours: ${fallbackHours}` : undefined}
      className={`inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 font-mono text-[11px] font-medium text-slate-600 transition-all ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      <span>{status.statusText}</span>
    </span>
  );
}
