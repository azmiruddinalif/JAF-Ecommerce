import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendPeriod = "Last 7 days",
  tone = "default",
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  trend?: { value: string; positive: boolean };
  trendPeriod?: string;
  tone?: "default" | "warning";
}) {
  return (
    <div className="group rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </span>
        {Icon && (
          <span
            className={
              tone === "warning"
                ? "flex size-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600"
                : "flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"
            }
          >
            <Icon size={15} />
          </span>
        )}
      </div>

      <p className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>

      {trend && (
        <div className="mt-3 flex items-center justify-between text-xs">
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              trend.positive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            {trend.positive ? (
              <ArrowUpRight size={13} className="text-emerald-600" />
            ) : (
              <ArrowDownRight size={13} className="text-rose-600" />
            )}
            {trend.value}
          </span>
          <span className="text-[11px] text-slate-400">{trendPeriod}</span>
        </div>
      )}
    </div>
  );
}
