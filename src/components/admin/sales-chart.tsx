import { formatCents } from "@/lib/money";

type SalesPoint = { date: Date; totalCents: number; orderCount: number };

function niceCeil(value: number): number {
  if (value <= 0) return 100;
  const exp = Math.floor(Math.log10(value));
  const base = 10 ** exp;
  const residual = value / base;
  const niceResidual = residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 5 ? 5 : 10;
  return niceResidual * base;
}

const dayLabel = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

export function SalesChart({ series, totalCents }: { series: SalesPoint[]; totalCents: number }) {
  const max = Math.max(...series.map((d) => d.totalCents));
  const niceMax = niceCeil(max);
  const ticks = [niceMax, niceMax / 2, 0];

  return (
    <div className="flex h-full flex-col border border-ink-border">
      <div className="flex items-center justify-between border-b border-ink-border px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider">Sales</h2>
          <p className="mt-0.5 text-xs text-paper-dim">Last {series.length} days</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wider text-paper-dim">Total revenue</p>
          <p className="font-display text-2xl text-paper">{formatCents(totalCents)}</p>
        </div>
      </div>

      <div className="flex flex-1 gap-3 px-5 pb-6 pt-14">
        <div className="flex h-40 flex-col justify-between py-[1px] text-right text-[10px] text-paper-dim">
          {ticks.map((t) => (
            <span key={t}>{formatCents(t)}</span>
          ))}
        </div>

        <div className="relative flex-1">
          <div className="absolute inset-0 flex h-40 flex-col justify-between">
            {ticks.map((t) => (
              <div key={t} className="border-t border-ink-border" />
            ))}
          </div>

          <div className="relative flex h-40 items-stretch gap-[3px]">
            {series.map((d, i) => {
              const pct = niceMax > 0 ? (d.totalCents / niceMax) * 100 : 0;
              const showLabel = i === 0 || i === series.length - 1 || i % 3 === 0;
              const edge = i <= 1 ? "left" : i >= series.length - 2 ? "right" : "center";
              const tooltipAlign =
                edge === "left" ? "justify-start" : edge === "right" ? "justify-end" : "justify-center";
              return (
                <div
                  key={dayLabel.format(d.date) + i}
                  tabIndex={0}
                  role="img"
                  aria-label={`${dayLabel.format(d.date)}: ${formatCents(d.totalCents)}, ${d.orderCount} order${d.orderCount === 1 ? "" : "s"}`}
                  className="group relative flex flex-1 flex-col justify-end outline-none"
                >
                  <div
                    className="w-full bg-gold-bright transition-colors group-hover:bg-gold group-focus-visible:bg-gold"
                    style={{ height: `${pct}%` }}
                  />

                  <div
                    className={`pointer-events-none absolute inset-x-0 bottom-full z-10 mb-2 flex opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 ${tooltipAlign}`}
                  >

                    <div className="whitespace-nowrap border border-ink-border bg-ink px-2.5 py-1.5 text-xs">
                      <p className="font-semibold text-paper">{formatCents(d.totalCents)}</p>
                      <p className="text-paper-dim">
                        {dayLabel.format(d.date)} · {d.orderCount} order{d.orderCount === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>

                  <span
                    aria-hidden
                    className="absolute top-full mt-2 w-full text-center text-[10px] text-paper-dim"
                  >
                    {showLabel ? dayLabel.format(d.date) : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
