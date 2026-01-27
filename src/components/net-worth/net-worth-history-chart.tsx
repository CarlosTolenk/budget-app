import { format, parseISO } from "date-fns";
import { formatCurrency } from "@/lib/format";
import { NetWorthHistoryEntry } from "@/application/use-cases/get-net-worth-history";

interface NetWorthHistoryChartProps {
  data: NetWorthHistoryEntry[];
}

export function NetWorthHistoryChart({ data }: NetWorthHistoryChartProps) {
  const maxAbs = Math.max(...data.map((entry) => Math.abs(entry.total)), 1);
  const slotWidth = 90;
  const height = 220;
  const padding = 24;
  const width = Math.max(360, data.length * slotWidth + padding * 2);
  const plotHeight = height - padding * 2;
  const stepX = slotWidth;

  const points = data.map((entry, index) => {
    const x = padding + slotWidth / 2 + index * stepX;
    const normalized = entry.total / maxAbs;
    const y = padding + (1 - (normalized + 1) / 2) * plotHeight;
    return { x, y, entry };
  });

  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Últimos 6 meses</p>
          <h2 className="text-2xl font-semibold">Evolución del patrimonio</h2>
          <p className="text-sm text-slate-300">Visualiza cómo cambia tu patrimonio neto mes a mes.</p>
        </div>
        <div className="text-xs text-slate-300">La línea sube o baja según el patrimonio.</div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <svg width={width} height={height} className="min-w-full">
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="rgba(255,255,255,0.12)" />
          <path d={path} fill="none" stroke="rgba(110, 231, 183, 0.9)" strokeWidth={3} />
          {points.map((point) => {
            const isPositive = point.entry.total >= 0;
            const label = formatCurrency(point.entry.total, point.entry.currency);
            return (
              <g key={point.entry.month}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={5}
                  fill={isPositive ? "rgba(110,231,183,0.95)" : "rgba(251,113,133,0.95)"}
                />
                <text
                  x={point.x}
                  y={point.y - 10}
                  textAnchor="middle"
                  fontSize="10"
                  fill={isPositive ? "rgb(110,231,183)" : "rgb(251,113,133)"}
                  fontWeight={600}
                >
                  {label}
                </text>
              </g>
            );
          })}
        </svg>
        <div
          className="mt-2 flex min-w-max text-xs uppercase tracking-wide text-slate-300"
          style={{ paddingLeft: `${padding}px`, paddingRight: `${padding}px` }}
        >
          {data.map((entry) => {
            const label = format(parseISO(`${entry.month}-01`), "LLL yyyy");
            return (
              <span key={entry.month} className="text-center" style={{ width: `${slotWidth}px` }}>
                {label}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
