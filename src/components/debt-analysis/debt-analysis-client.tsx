"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { formatCurrency, formatMonthLabel } from "@/lib/format";
import type { Debt, DebtPlanInput, ExtraPayment, StrategyComparison } from "@/modules/debt-analysis";
import { planDebtStrategiesAction } from "@/app/actions/debt-analysis-actions";

const DEFAULT_CURRENCY: Debt["currency"] = "DOP";
const DEFAULT_APR: Debt["aprType"] = "nominal";

const emptyDebtDraft = (startDate: string) => ({
  id: "",
  name: "",
  principal: "",
  annualRate: "",
  startDate,
  termMonths: "",
  minPayment: "",
  feesMonthly: "",
  currency: DEFAULT_CURRENCY,
  aprType: DEFAULT_APR,
});

const emptyExtraDraft = (applyTo: string) => ({
  applyTo,
  date: "",
  amount: "",
  mode: "reduce_term" as const,
});

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `debt-${Math.random().toString(36).slice(2, 10)}`;
}

function parseNumber(value: string): number | undefined {
  if (value.trim() === "") {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function DebtAnalysisClient() {
  const today = new Date();
  const defaultStartDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const [debts, setDebts] = useState<Debt[]>([]);
  const [debtDraft, setDebtDraft] = useState(() => emptyDebtDraft(defaultStartDate));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [extraPayments, setExtraPayments] = useState<ExtraPayment[]>([]);
  const [extraDraft, setExtraDraft] = useState(() => emptyExtraDraft(""));
  const [strategy, setStrategy] = useState<DebtPlanInput["budget"]["strategy"]>("snowball");
  const [monthlyExtraBudget, setMonthlyExtraBudget] = useState("0");
  const [budgetStartMonth, setBudgetStartMonth] = useState(defaultStartDate);
  const [comparison, setComparison] = useState<StrategyComparison | null>(null);
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null);
  const [visibleRows, setVisibleRows] = useState(12);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const currency = debts[0]?.currency ?? DEFAULT_CURRENCY;

  const currentStrategyResult = comparison ? comparison[strategy] : null;
  const baseline = comparison?.baseline ?? null;

  const payoffTimeline = useMemo(() => {
    if (!currentStrategyResult) {
      return [];
    }
    return [...currentStrategyResult.debtSummaries].sort((a, b) => {
      if (!a.payoffDate || !b.payoffDate) {
        return 0;
      }
      return a.payoffDate.localeCompare(b.payoffDate);
    });
  }, [currentStrategyResult]);

  const selectedPlanPayments = useMemo(() => {
    if (!selectedDebtId || !currentStrategyResult) {
      return [];
    }
    return currentStrategyResult.schedule
      .flatMap((month) => month.payments)
      .filter((payment) => payment.debtId === selectedDebtId);
  }, [currentStrategyResult, selectedDebtId]);
  const firstTargetDebtId = useMemo(() => {
    if (!currentStrategyResult) {
      return null;
    }
    const firstExtra = currentStrategyResult.schedule
      .flatMap((month) => month.payments)
      .find((payment) => payment.extraPayment > 0);
    if (firstExtra) {
      return firstExtra.debtId;
    }
    const firstPayment = currentStrategyResult.schedule
      .flatMap((month) => month.payments)
      .find((payment) => payment.totalPayment > 0);
    return firstPayment?.debtId ?? null;
  }, [currentStrategyResult]);
  const hasNonAmortizable =
    Boolean(comparison?.baseline.metrics.nonAmortizable) ||
    Boolean(comparison?.snowball.metrics.nonAmortizable) ||
    Boolean(comparison?.avalanche.metrics.nonAmortizable);

  const canSimulate = debts.length > 0 && !isPending;

  useEffect(() => {
    if (!comparison || !firstTargetDebtId) {
      return;
    }
    setSelectedDebtId(firstTargetDebtId);
  }, [comparison, firstTargetDebtId, strategy]);

  function resetDraft() {
    setDebtDraft(emptyDebtDraft(defaultStartDate));
    setEditingId(null);
  }

  function handleSaveDebt() {
    setErrorMessage(null);
    const baseCurrency = debts.find((debt) => debt.id !== editingId)?.currency;
    if (baseCurrency && debtDraft.currency !== baseCurrency) {
      setErrorMessage("Todas las deudas deben usar la misma moneda.");
      return;
    }
    const principal = parseNumber(debtDraft.principal);
    const annualRatePercent = parseNumber(debtDraft.annualRate);
    if (!debtDraft.name || principal === undefined || annualRatePercent === undefined) {
      setErrorMessage("Completa nombre, principal y tasa anual.");
      return;
    }

    const termMonths = parseNumber(debtDraft.termMonths);
    const minPayment = parseNumber(debtDraft.minPayment);
    if (!termMonths && !minPayment) {
      setErrorMessage("Indica el plazo (meses), el pago mínimo o ambos.");
      return;
    }

    const newDebt: Debt = {
      id: editingId ?? createId(),
      name: debtDraft.name,
      principal,
      annualRate: annualRatePercent / 100,
      startDate: debtDraft.startDate,
      termMonths: termMonths ? Math.max(1, Math.round(termMonths)) : undefined,
      minPayment,
      feesMonthly: parseNumber(debtDraft.feesMonthly) ?? undefined,
      currency: debtDraft.currency,
      aprType: debtDraft.aprType,
    };

    setDebts((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === newDebt.id);
      if (existingIndex === -1) {
        return [...prev, newDebt];
      }
      const next = [...prev];
      next[existingIndex] = newDebt;
      return next;
    });
    resetDraft();
  }

  function handleEditDebt(debt: Debt) {
    setDebtDraft({
      id: debt.id,
      name: debt.name,
      principal: debt.principal.toString(),
      annualRate: (debt.annualRate * 100).toFixed(2),
      startDate: debt.startDate,
      termMonths: debt.termMonths?.toString() ?? "",
      minPayment: debt.minPayment?.toString() ?? "",
      feesMonthly: debt.feesMonthly?.toString() ?? "",
      currency: debt.currency,
      aprType: debt.aprType,
    });
    setEditingId(debt.id);
  }

  function handleRemoveDebt(id: string) {
    setDebts((prev) => prev.filter((debt) => debt.id !== id));
    setExtraPayments((prev) => prev.filter((extra) => extra.applyTo !== id));
    if (selectedDebtId === id) {
      setSelectedDebtId(null);
    }
  }

  function handleAddExtraPayment() {
    setErrorMessage(null);
    if (!extraDraft.applyTo) {
      setErrorMessage("Selecciona una deuda para el abono.");
      return;
    }
    const amount = parseNumber(extraDraft.amount);
    if (!extraDraft.date || !amount) {
      setErrorMessage("Completa fecha y monto del abono.");
      return;
    }
    const entry: ExtraPayment = {
      applyTo: extraDraft.applyTo,
      date: extraDraft.date,
      amount,
      mode: extraDraft.mode,
    };
    setExtraPayments((prev) => [...prev, entry]);
    setExtraDraft(emptyExtraDraft(extraDraft.applyTo));
  }

  function handleSimulate() {
    setErrorMessage(null);
    setComparison(null);
    if (!debts.length) {
      setErrorMessage("Agrega al menos una deuda para simular.");
      return;
    }

    startTransition(async () => {
      const budgetValue = parseNumber(monthlyExtraBudget) ?? 0;
      const planResult = await planDebtStrategiesAction({
        debts,
        budget: {
          monthlyExtraBudget: budgetValue,
          strategy,
          budgetStartMonth,
          rounding: { decimals: 2 },
        },
        extraPayments,
      });

      if (planResult.status === "error") {
        setErrorMessage(planResult.message);
        return;
      }

      setComparison(planResult.data);
      setSelectedDebtId((current) => current ?? debts[0]?.id ?? null);
      setVisibleRows(12);
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,340px)_1fr]">
        <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <h2 className="text-lg font-semibold">Nueva deuda</h2>
          <p className="text-xs text-slate-300">Registra una deuda con tasa anual (%), cuota o plazo.</p>
          <div className="mt-4 space-y-3 text-sm">
            <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
              Nombre
              <input
                className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                value={debtDraft.name}
                onChange={(event) => setDebtDraft((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Tarjeta principal"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
              Principal
              <input
                type="number"
                step="0.01"
                className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                value={debtDraft.principal}
                onChange={(event) => setDebtDraft((prev) => ({ ...prev, principal: event.target.value }))}
                placeholder="25000"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
              Tasa anual (%)
              <input
                type="number"
                step="0.01"
                className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                value={debtDraft.annualRate}
                onChange={(event) => setDebtDraft((prev) => ({ ...prev, annualRate: event.target.value }))}
                placeholder="18.5"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
              Inicio (YYYY-MM)
              <input
                type="month"
                className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                value={debtDraft.startDate}
                onChange={(event) => setDebtDraft((prev) => ({ ...prev, startDate: event.target.value }))}
              />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
                Plazo (meses)
                <input
                  type="number"
                  className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                  value={debtDraft.termMonths}
                  onChange={(event) =>
                    setDebtDraft((prev) => ({
                      ...prev,
                      termMonths: event.target.value,
                    }))
                  }
                  placeholder="24"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
                Pago mínimo
                <input
                  type="number"
                  step="0.01"
                  className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                  value={debtDraft.minPayment}
                  onChange={(event) =>
                    setDebtDraft((prev) => ({
                      ...prev,
                      minPayment: event.target.value,
                    }))
                  }
                  placeholder="650"
                />
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
                Fee mensual
                <input
                  type="number"
                  step="0.01"
                  className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                  value={debtDraft.feesMonthly}
                  onChange={(event) => setDebtDraft((prev) => ({ ...prev, feesMonthly: event.target.value }))}
                  placeholder="0"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
                Moneda
                <select
                  className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                  value={debtDraft.currency}
                  onChange={(event) => setDebtDraft((prev) => ({ ...prev, currency: event.target.value as Debt["currency"] }))}
                >
                  <option value="DOP" className="text-slate-900">DOP</option>
                  <option value="USD" className="text-slate-900">USD</option>
                </select>
              </label>
            </div>
            <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
              Tipo APR
              <select
                className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                value={debtDraft.aprType}
                onChange={(event) => setDebtDraft((prev) => ({ ...prev, aprType: event.target.value as Debt["aprType"] }))}
              >
                <option value="nominal" className="text-slate-900">Nominal</option>
                <option value="effective" className="text-slate-900">Efectiva</option>
              </select>
            </label>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleSaveDebt}
                className="rounded-full bg-emerald-400/90 px-4 py-2 text-sm font-semibold text-slate-900"
              >
                {editingId ? "Actualizar deuda" : "Agregar deuda"}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetDraft}
                  className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white"
                >
                  Cancelar edición
                </button>
              ) : null}
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold">Deudas registradas</h2>
              <p className="text-xs text-slate-300">Edita o elimina para ajustar la simulación.</p>
            </div>
            <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-200">
              {debts.length} deuda{debts.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {debts.length ? (
              debts.map((debt) => (
                <div key={debt.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-white">{debt.name}</p>
                      <p className="text-xs text-slate-300">
                        {formatCurrency(debt.principal, debt.currency)} · {(debt.annualRate * 100).toFixed(2)}% · {debt.aprType}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditDebt(debt)}
                        className="rounded-full border border-white/20 px-3 py-1 text-xs text-white"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveDebt(debt.id)}
                        className="rounded-full border border-rose-300/40 px-3 py-1 text-xs text-rose-200"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 grid gap-2 text-xs text-slate-300 md:grid-cols-2">
                    <span>Inicio: {formatMonthLabel(debt.startDate)}</span>
                    <span>
                      {debt.termMonths ? `Plazo: ${debt.termMonths} meses` : `Pago mínimo: ${formatCurrency(debt.minPayment ?? 0, debt.currency)}`}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-300">Aún no agregas deudas. Usa el formulario para comenzar.</p>
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,360px)_1fr]">
        <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <h2 className="text-lg font-semibold">Abonos extra</h2>
          <p className="text-xs text-slate-300">Registra pagos extra por mes y define el modo.</p>
          <div className="mt-4 space-y-3 text-sm">
            <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
              Deuda objetivo
              <select
                className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                value={extraDraft.applyTo}
                onChange={(event) => setExtraDraft((prev) => ({ ...prev, applyTo: event.target.value }))}
              >
                <option value="" className="text-slate-900">Selecciona una deuda</option>
                {debts.map((debt) => (
                  <option key={debt.id} value={debt.id} className="text-slate-900">
                    {debt.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
              Mes del abono
              <input
                type="month"
                className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                value={extraDraft.date}
                onChange={(event) => setExtraDraft((prev) => ({ ...prev, date: event.target.value }))}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
              Monto extra
              <input
                type="number"
                step="0.01"
                className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                value={extraDraft.amount}
                onChange={(event) => setExtraDraft((prev) => ({ ...prev, amount: event.target.value }))}
                placeholder="1500"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
              Modo
              <select
                className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                value={extraDraft.mode}
                onChange={(event) => setExtraDraft((prev) => ({ ...prev, mode: event.target.value as ExtraPayment["mode"] }))}
              >
                <option value="reduce_term" className="text-slate-900">Reducir plazo</option>
                <option value="reduce_payment" className="text-slate-900">Reducir cuota</option>
              </select>
            </label>
            <button
              type="button"
              onClick={handleAddExtraPayment}
              className="w-full rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white"
            >
              Agregar abono
            </button>
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <h2 className="text-lg font-semibold">Abonos registrados</h2>
          <div className="mt-4 space-y-3">
            {extraPayments.length ? (
              extraPayments.map((extra, index) => {
                const debtName = debts.find((debt) => debt.id === extra.applyTo)?.name ?? "Deuda";
                return (
                  <div key={`${extra.applyTo}-${index}`} className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-white">{debtName}</p>
                        <p className="text-xs text-slate-300">
                          {extra.date ? formatMonthLabel(extra.date) : ""} · {formatCurrency(extra.amount, currency)} · {extra.mode}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExtraPayments((prev) => prev.filter((_, i) => i !== index))}
                        className="rounded-full border border-rose-300/40 px-3 py-1 text-xs text-rose-200"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-300">No has agregado abonos extras aún.</p>
            )}
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Estrategia mensual</h2>
            <p className="text-xs text-slate-300">Define el extra mensual y compara snowball vs avalanche.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <select
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-white"
              value={strategy}
              onChange={(event) => setStrategy(event.target.value as DebtPlanInput["budget"]["strategy"])}
            >
              <option value="snowball" className="text-slate-900">Snowball</option>
              <option value="avalanche" className="text-slate-900">Avalanche</option>
            </select>
            <input
              type="month"
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-white"
              value={budgetStartMonth}
              onChange={(event) => setBudgetStartMonth(event.target.value)}
              aria-label="Aplicar extra desde"
            />
            <input
              type="number"
              step="0.01"
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-white"
              value={monthlyExtraBudget}
              onChange={(event) => setMonthlyExtraBudget(event.target.value)}
              placeholder="Extra mensual"
            />
            <button
              type="button"
              onClick={handleSimulate}
              disabled={!canSimulate}
              className="rounded-full bg-emerald-400/90 px-4 py-2 text-sm font-semibold text-slate-900 disabled:cursor-not-allowed disabled:bg-white/20"
            >
              {isPending ? "Simulando..." : "Simular"}
            </button>
          </div>
        </div>
        {errorMessage ? <p className="mt-3 text-sm text-rose-300">{errorMessage}</p> : null}
      </section>

      {comparison ? (
        <section className="grid gap-4 lg:grid-cols-4">
          <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Interés total</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {formatCurrency(currentStrategyResult?.metrics.totalInterest ?? 0, currency)}
            </p>
            <p className="text-xs text-slate-300">Baseline: {formatCurrency(baseline?.metrics.totalInterest ?? 0, currency)}</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Meses totales</p>
            <p className="mt-2 text-2xl font-semibold text-white">{currentStrategyResult?.metrics.months ?? 0}</p>
            <p className="text-xs text-slate-300">Baseline: {baseline?.metrics.months ?? 0} meses</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Fecha payoff</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {currentStrategyResult?.metrics.payoffDate ? formatMonthLabel(currentStrategyResult.metrics.payoffDate) : "-"}
            </p>
            <p className="text-xs text-slate-300">Baseline: {baseline?.metrics.payoffDate ? formatMonthLabel(baseline.metrics.payoffDate) : "-"}</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Interés ahorrado</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-300">
              {formatCurrency(comparison.savings[strategy].interestSaved, currency)}
            </p>
            <p className="text-xs text-slate-300">vs baseline</p>
          </article>
        </section>
      ) : null}

      {hasNonAmortizable ? (
        <p className="text-sm text-rose-300">
          Algunas deudas no amortizan con los pagos mínimos actuales. Ajusta el pago mínimo o agrega presupuesto extra.
        </p>
      ) : null}

      {comparison ? (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <h2 className="text-lg font-semibold">Comparador de estrategias</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-xs text-slate-200">
              <thead className="text-[11px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="py-2">Escenario</th>
                  <th className="py-2">Interés total</th>
                  <th className="py-2">Meses</th>
                  <th className="py-2">Payoff</th>
                  <th className="py-2">Ahorro interés</th>
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    { key: "baseline", label: "Baseline" },
                    { key: "snowball", label: "Snowball" },
                    { key: "avalanche", label: "Avalanche" },
                  ] as const
                ).map((row) => {
                  const result = comparison[row.key];
                  const savings = row.key === "baseline" ? 0 : comparison.savings[row.key].interestSaved;
                  return (
                    <tr key={row.key} className="border-t border-white/10">
                      <td className="py-2 font-semibold text-white">{row.label}</td>
                      <td className="py-2">{formatCurrency(result.metrics.totalInterest, currency)}</td>
                      <td className="py-2">{result.metrics.months}</td>
                      <td className="py-2">{result.metrics.payoffDate ? formatMonthLabel(result.metrics.payoffDate) : "-"}</td>
                      <td className="py-2">{row.key === "baseline" ? "-" : formatCurrency(savings, currency)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {comparison ? (
        <section className="grid gap-4 lg:grid-cols-[minmax(0,280px)_1fr]">
          <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <h2 className="text-lg font-semibold">Hitos por deuda</h2>
            <p className="text-xs text-slate-300">Fechas de payoff usando {strategy}.</p>
            <div className="mt-4 space-y-3 text-sm">
              {payoffTimeline.length ? (
                payoffTimeline.map((summary) => (
                  <div key={summary.debtId} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-sm font-semibold text-white">{summary.name}</p>
                    <p className="text-xs text-slate-300">
                      {summary.payoffDate ? formatMonthLabel(summary.payoffDate) : "-"} · Interés {formatCurrency(summary.totalInterest, currency)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-300">No hay hitos aún.</p>
              )}
            </div>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">Amortización por deuda</h2>
                <p className="text-xs text-slate-300">Tabla mensual con pagos regulares + abonos (incluye estrategia mensual).</p>
              </div>
              <select
                className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs text-white"
                value={selectedDebtId ?? ""}
                onChange={(event) => {
                  setSelectedDebtId(event.target.value);
                  setVisibleRows(12);
                }}
              >
                <option value="" className="text-slate-900">Selecciona deuda</option>
                {debts.map((debt) => (
                  <option key={debt.id} value={debt.id} className="text-slate-900">
                    {debt.name}
                  </option>
                ))}
              </select>
            </div>
            {selectedPlanPayments.length ? (
              <div className="mt-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-xs text-slate-200">
                    <thead className="text-[11px] uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="py-2">Mes</th>
                        <th className="py-2">Pago</th>
                        <th className="py-2">Extra</th>
                        <th className="py-2">Interés</th>
                        <th className="py-2">Principal</th>
                        <th className="py-2">Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPlanPayments.slice(0, visibleRows).map((entry) => (
                        <tr
                          key={`${entry.monthId}-${entry.debtId}`}
                          className={`border-t border-white/10 ${entry.extraPayment > 0 ? "bg-emerald-500/10" : ""}`}
                        >
                          <td className="py-2">{formatMonthLabel(entry.monthId)}</td>
                          <td className="py-2">{formatCurrency(entry.totalPayment, currency)}</td>
                          <td className="py-2">{formatCurrency(entry.extraPayment, currency)}</td>
                          <td className="py-2">{formatCurrency(entry.interest, currency)}</td>
                          <td className="py-2">{formatCurrency(entry.principal, currency)}</td>
                          <td className="py-2">{formatCurrency(entry.endingBalance, currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {selectedPlanPayments.length > visibleRows ? (
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setVisibleRows((prev) => prev + 12)}
                      className="rounded-full border border-white/20 px-4 py-2 text-xs text-white"
                    >
                      Mostrar más
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-300">Selecciona una deuda para ver su amortización.</p>
            )}
          </article>
        </section>
      ) : null}
    </div>
  );
}
