"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import clsx from "clsx";
import { formatCurrency, formatPercent } from "@/lib/format";

export type BudgetAlert = {
  id: string;
  categoryName: string;
  level: "warning" | "danger";
  planned: number;
  spent: number;
  ratio: number;
};

const levelCopy: Record<
  BudgetAlert["level"],
  { title: string; accent: string; text: string }
> = {
  warning: {
    title: "Alerta",
    accent: "bg-amber-400/10 text-amber-200 border-amber-400/40",
    text: "Estás cerca de llegar al plan.",
  },
  danger: {
    title: "Crítico",
    accent: "bg-rose-500/10 text-rose-200 border-rose-400/40",
    text: "Sobrepasaste tu plan.",
  },
};

export function NotificationsBell() {
  const [currentMonth, setCurrentMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const badgeTone = useMemo(() => {
    if (alerts.some((alert) => alert.level === "danger")) {
      return "danger";
    }
    if (alerts.length > 0) {
      return "warning";
    }
    return "idle";
  }, [alerts]);

  useEffect(() => {
    const checkMonth = () => {
      const month = format(new Date(), "yyyy-MM");
      setCurrentMonth((previous) => (previous === month ? previous : month));
    };
    const interval = setInterval(checkMonth, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    async function loadAlerts() {
      setIsLoading(true);
      setError(null);
      try {
        const query = currentMonth ? `?month=${encodeURIComponent(currentMonth)}` : "";
        const response = await fetch(`/api/budget-alerts${query}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("No se pudieron cargar las alertas");
        }
        const data = (await response.json()) as { alerts?: BudgetAlert[] };
        if (!isActive) {
          return;
        }
        setAlerts(data.alerts ?? []);
      } catch (fetchError) {
        if (!isActive || controller.signal.aborted) {
          return;
        }
        console.error(fetchError);
        setAlerts([]);
        setError("No se pudieron cargar las alertas.");
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadAlerts();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [currentMonth]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  return (
    <div className="relative z-[60]" ref={containerRef}>
      <button
        type="button"
        aria-label={
          alerts.length
            ? `Tienes ${alerts.length} alertas de presupuesto`
            : "Sin alertas de presupuesto"
        }
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={() => setIsOpen((open) => !open)}
        className={clsx(
          "relative flex h-10 w-10 items-center justify-center rounded-full border transition",
          badgeTone === "danger"
            ? "border-rose-400/60 bg-rose-500/10 text-rose-100 hover:border-rose-200"
            : badgeTone === "warning"
              ? "border-amber-300/60 bg-amber-400/10 text-amber-100 hover:border-amber-200"
              : "border-white/20 bg-white/5 text-white hover:border-white/40",
        )}
      >
        <BellIcon />
        {alerts.length > 0 && !isLoading && (
          <span
            className={clsx(
              "absolute -right-1 -top-1 flex h-5 min-w-[1rem] items-center justify-center rounded-full px-1 text-[11px] font-semibold",
              badgeTone === "danger"
                ? "bg-rose-500 text-white"
                : "bg-amber-400 text-slate-900",
            )}
          >
            {alerts.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-[70] mt-3 w-80 rounded-2xl border border-white/10 bg-slate-950/95 p-4 text-sm shadow-2xl">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-white">Alertas de presupuesto</p>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs text-slate-400 transition hover:text-white"
            >
              Cerrar
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Recibirás avisos cuando alguna categoría supere el 80% de lo planificado.
          </p>
          <div className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1 text-sm">
            {isLoading ? (
              <p className="text-sm text-slate-400">Cargando alertas...</p>
            ) : error ? (
              <p className="text-sm text-rose-300">{error}</p>
            ) : alerts.length ? (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={clsx(
                    "rounded-2xl border px-3 py-2",
                    levelCopy[alert.level].accent,
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-white">{alert.categoryName}</p>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/80">
                      {formatPercent(alert.ratio)}
                    </span>
                  </div>
                  <p className="text-xs text-white/80">{levelCopy[alert.level].text}</p>
                  <p className="mt-2 text-xs text-slate-200">
                    {formatCurrency(alert.spent)} gastado de {formatCurrency(alert.planned)} planificado.
                  </p>
                  {alert.level === "danger" ? (
                    <p className="text-[11px] text-rose-100">
                      Exceso: {formatCurrency(alert.spent - alert.planned)}
                    </p>
                  ) : (
                    <p className="text-[11px] text-amber-100">
                      Disponible antes del límite: {formatCurrency(Math.max(alert.planned - alert.spent, 0))}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No tienes alertas este mes.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" focusable="false">
      <path
        d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22zm6.36-5-.86-.72V11a5.5 5.5 0 0 0-4-5.29V4a1.5 1.5 0 0 0-3 0v1.71A5.5 5.5 0 0 0 6.5 11v5.28l-.86.72A1 1 0 0 0 6 19h12a1 1 0 0 0 .36-1.94Z"
        fill="currentColor"
      />
    </svg>
  );
}
