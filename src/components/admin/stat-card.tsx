export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number }>;
  tone?: "default" | "warning";
}) {
  return (
    <div className="group border border-ink-border bg-ink-raised p-5 transition-colors hover:border-gold-bright/40">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-paper-dim">{label}</span>
        <span
          className={
            tone === "warning"
              ? "flex size-8 items-center justify-center bg-danger/10 text-danger"
              : "flex size-8 items-center justify-center bg-gold-bright/10 text-gold"
          }
        >
          <Icon size={15} />
        </span>
      </div>
      <p className="mt-4 font-display text-3xl">{value}</p>
    </div>
  );
}
