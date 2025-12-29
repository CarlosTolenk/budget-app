"use client";

import { useActionState, useEffect, useState } from "react";
import type { Income } from "@/domain/income/income";
import { formatCurrency, formatMonthLabel } from "@/lib/format";
import { initialActionState } from "@/app/actions/action-state";
import { updateIncomeAction, deleteIncomeAction } from "@/app/actions/income-actions";
import { ModalConfirmButton } from "@/components/ui/modal-confirm-button";

interface IncomeListProps {
  incomes: Income[];
}

export function IncomeList({ incomes }: IncomeListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [updateState, updateAction] = useActionState(updateIncomeAction, initialActionState);
  const [deleteState, deleteAction] = useActionState(deleteIncomeAction, initialActionState);
  const [incomeToDelete, setIncomeToDelete] = useState<Income | null>(null);

  useEffect(() => {
    if (updateState.status === "success") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditingId(null);
    }
  }, [updateState.status]);

  useEffect(() => {
    if (deleteState.status === "success") {
      setIncomeToDelete(null);
    }
  }, [deleteState.status]);

  if (!incomes.length) {
    return (
      <ul className="mt-4 space-y-3 text-sm">
        <li className="text-slate-400">Aún no tienes ingresos registrados.</li>
      </ul>
    );
  }

  return (
    <div className="mt-4 space-y-3 text-sm">
      <ul className="space-y-3">
        {incomes.map((income) => {
          const isEditing = editingId === income.id;
          if (isEditing) {
            return (
              <li key={income.id} className="rounded-xl border border-emerald-300/30 bg-emerald-300/5 px-3 py-2">
                <form action={updateAction} className="flex flex-col gap-2 md:flex-row md:items-end md:gap-3">
                  <input type="hidden" name="id" value={income.id} />
                  <label className="flex-1 text-xs uppercase tracking-wide text-slate-400">
                    Nombre
                    <input
                      name="name"
                      defaultValue={income.name}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                      required
                    />
                  </label>
                  <label className="flex-1 text-xs uppercase tracking-wide text-slate-400">
                    Monto
                    <input
                      type="number"
                      step="0.01"
                      name="amount"
                      defaultValue={income.amount}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                      required
                    />
                  </label>
                  <div className="flex gap-2">
                    <button type="submit" className="rounded-full bg-emerald-400/90 px-3 py-2 text-xs font-semibold text-slate-900">
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-full border border-white/20 px-3 py-2 text-xs font-semibold text-white"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </li>
            );
          }

          return (
            <li key={income.id} className="flex flex-col gap-2 rounded-xl border border-white/10 px-3 py-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium">{income.name}</p>
                <p className="text-xs text-slate-400">{formatMonthLabel(income.month)}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-emerald-300">{formatCurrency(income.amount)}</p>
                <button
                  type="button"
                  onClick={() => setEditingId(income.id)}
                  className="rounded-full border border-white/20 px-3 py-1 text-xs font-medium text-white"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => setIncomeToDelete(income)}
                  className="rounded-full border border-rose-300/40 px-3 py-1 text-xs font-medium text-rose-200 transition hover:border-rose-200"
                >
                  Eliminar
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {updateState.message && (
        <p className={`text-xs ${updateState.status === "success" ? "text-emerald-300" : "text-rose-300"}`}>{updateState.message}</p>
      )}
      {deleteState.message && (
        <p className={`text-xs ${deleteState.status === "success" ? "text-emerald-300" : "text-rose-300"}`}>{deleteState.message}</p>
      )}
      {incomeToDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/90 p-6 text-sm shadow-2xl" role="dialog" aria-modal="true">
            <p className="text-base font-semibold text-white">Eliminar ingreso</p>
            <p className="mt-2 text-slate-300">
              ¿Seguro que deseas eliminar <span className="font-semibold text-white">{incomeToDelete.name}</span> del mes{" "}
              {incomeToDelete.month}? Esta acción no se puede deshacer.
            </p>
            {deleteState.status === "error" && deleteState.message && (
              <p className="mt-3 text-xs text-rose-300">{deleteState.message}</p>
            )}
            <form action={deleteAction} className="mt-6 flex justify-end gap-2">
              <input type="hidden" name="id" value={incomeToDelete.id} />
              <button
                type="button"
                onClick={() => setIncomeToDelete(null)}
                className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/40"
              >
                Cancelar
              </button>
              <ModalConfirmButton label="Eliminar" pendingLabel="Eliminando..." variant="danger" />
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
