import Link from "next/link";
import { addMonths, format, parseISO, subMonths } from "date-fns";

interface MonthSwitcherProps {
  month: string;
}

export function MonthSwitcher({ month }: MonthSwitcherProps) {
  const baseDate = parseISO(`${month}-01`);
  const prevDate = subMonths(baseDate, 1);
  const nextDate = addMonths(baseDate, 1);
  const prev = format(prevDate, "yyyy-MM");
  const next = format(nextDate, "yyyy-MM");

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <Link
        href={`/?month=${prev}`}
        className="rounded-full border border-white/10 px-4 py-1 text-white hover:bg-white/10"
      >
        ← {format(prevDate, "LLL yyyy")}
      </Link>
      <form className="flex items-center gap-2" action="/" method="get">
        <input
          type="month"
          name="month"
          defaultValue={month}
          className="rounded-lg border border-white/10 bg-white/10 px-3 py-1 text-sm text-white"
        />
        <button className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-900" type="submit">
          Ir
        </button>
      </form>
      <Link
        href={`/?month=${next}`}
        className="rounded-full border border-white/10 px-4 py-1 text-white hover:bg-white/10"
      >
        {format(nextDate, "LLL yyyy")} →
      </Link>
    </div>
  );
}
