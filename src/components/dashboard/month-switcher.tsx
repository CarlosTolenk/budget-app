"use client";

import { addMonths, format, parseISO, subMonths } from "date-fns";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

interface MonthSwitcherProps {
  month: string;
}

export function MonthSwitcher({ month }: MonthSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const baseDate = parseISO(`${month}-01`);
  const prevDate = subMonths(baseDate, 1);
  const nextDate = addMonths(baseDate, 1);
  const prev = format(prevDate, "yyyy-MM");
  const next = format(nextDate, "yyyy-MM");
  const handleNavigate = (targetMonth: string) => {
    startTransition(() => {
      router.push(`/?month=${targetMonth}`);
    });
  };
  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const value = (formData.get("month") as string) ?? month;
    handleNavigate(value);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <button
        type="button"
        onClick={() => handleNavigate(prev)}
        className="rounded-full border border-white/10 px-4 py-1 text-white transition hover:bg-white/10 disabled:opacity-60"
        disabled={isPending}
      >
        ← {format(prevDate, "LLL yyyy")}
      </button>
      <form className="flex items-center gap-2" onSubmit={handleSubmit}>
        <input
          type="month"
          name="month"
          defaultValue={month}
          className="rounded-lg border border-white/10 bg-white/10 px-3 py-1 text-sm text-white"
        />
        <button
          className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-900 disabled:opacity-60"
          type="submit"
          disabled={isPending}
        >
          Ir
        </button>
      </form>
      <button
        type="button"
        onClick={() => handleNavigate(next)}
        className="rounded-full border border-white/10 px-4 py-1 text-white transition hover:bg-white/10 disabled:opacity-60"
        disabled={isPending}
      >
        {format(nextDate, "LLL yyyy")} →
      </button>
      {isPending && (
        <span className="flex items-center gap-2 text-xs text-slate-300">
          <span className="h-2 w-2 animate-ping rounded-full bg-white" aria-hidden />
          Cargando mes...
        </span>
      )}
    </div>
  );
}
