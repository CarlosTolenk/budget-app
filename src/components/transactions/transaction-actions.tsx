"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Category } from "@/domain/categories/category";
import { Transaction } from "@/domain/transactions/transaction";
import { deleteTransactionAction } from "@/app/actions/delete-transaction-action";
import { updateTransactionAction } from "@/app/actions/update-transaction-action";
import { initialActionState } from "@/app/actions/action-state";
import { format } from "date-fns";
import { ModalConfirmButton } from "@/components/ui/modal-confirm-button";

const buckets = [
  { value: "NEEDS", label: "Needs" },
  { value: "WANTS", label: "Wants" },
  { value: "SAVINGS", label: "Savings" },
];

interface TransactionActionsProps {
  transaction: Transaction;
  categories: Category[];
}

export function TransactionActions({ transaction, categories }: TransactionActionsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formState, formAction] = useActionState(updateTransactionAction, initialActionState);
  const [deleteState, deleteAction] = useActionState(deleteTransactionAction, initialActionState);
  const [bucket, setBucket] = useState<"NEEDS" | "WANTS" | "SAVINGS">(transaction.bucket);
  const [categoryId, setCategoryId] = useState(transaction.categoryId ?? "");
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  const filteredCategories = useMemo(
    () => categories.filter((category) => category.bucket === bucket),
    [categories, bucket],
  );

  const resolvedCategoryId = useMemo(() => {
    if (!filteredCategories.length) {
      return "";
    }
    if (categoryId && filteredCategories.some((category) => category.id === categoryId)) {
      return categoryId;
    }
    return filteredCategories[0]?.id ?? "";
  }, [categoryId, filteredCategories]);

  const canSubmit = filteredCategories.length > 0 && Boolean(resolvedCategoryId);

  useEffect(() => {
    if (deleteState.status === "success") {
      setTransactionToDelete(null);
    }
  }, [deleteState.status]);

  return (
    <div className="mt-2 space-y-2 text-xs">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setIsEditing((prev) => !prev)}
          className="rounded-full border border-white/20 px-3 py-1 text-xs text-white"
        >
          {isEditing ? "Cerrar" : "Editar"}
        </button>
        <button
          type="button"
          onClick={() => setTransactionToDelete(transaction)}
          className="rounded-full border border-rose-300 px-3 py-1 text-xs text-rose-200 transition hover:border-rose-200"
        >
          Eliminar
        </button>
      </div>
      {deleteState.status === "error" && <p className="text-rose-300">{deleteState.message}</p>}
      {isEditing && (
        <form action={formAction} className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
          <input type="hidden" name="transactionId" value={transaction.id} />
          <label className="flex flex-col gap-1 text-[11px] uppercase tracking-wide text-slate-400">
            Fecha
            <input
              type="date"
              name="date"
              defaultValue={format(transaction.date, "yyyy-MM-dd")}
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-1 text-white"
            />
          </label>
          <label className="flex flex-col gap-1 text-[11px] uppercase tracking-wide text-slate-400">
            Monto
            <input
              type="number"
              step="0.01"
              name="amount"
              defaultValue={Math.abs(transaction.amount)}
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-1 text-white"
            />
          </label>
          <label className="flex flex-col gap-1 text-[11px] uppercase tracking-wide text-slate-400">
            Bucket
            <select
              name="bucket"
              value={bucket}
              onChange={(event) => setBucket(event.target.value as typeof bucket)}
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-1 text-white"
            >
              {buckets.map((bucket) => (
                <option key={bucket.value} value={bucket.value} className="text-slate-900">
                  {bucket.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[11px] uppercase tracking-wide text-slate-400">
            Categoría
            <select
              name="categoryId"
              value={resolvedCategoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              disabled={!filteredCategories.length}
              required={filteredCategories.length > 0}
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-1 text-white"
            >
              <option value="" disabled>
                Selecciona
              </option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id} className="text-slate-900">
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          {!filteredCategories.length ? (
            <p className="text-[11px] text-rose-300">Este bucket no tiene categorías disponibles.</p>
          ) : null}
          <button
            className="w-full rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-900 disabled:cursor-not-allowed disabled:bg-white/20"
            type="submit"
            disabled={!canSubmit}
          >
            Guardar cambios
          </button>
          {formState.message && (
            <p className={`text-[11px] ${formState.status === "success" ? "text-emerald-300" : "text-rose-300"}`}>
              {formState.message}
            </p>
          )}
        </form>
      )}
      {transactionToDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/90 p-6 text-sm shadow-2xl" role="dialog" aria-modal="true">
            <p className="text-base font-semibold text-white">Eliminar transacción</p>
            <p className="mt-2 text-slate-300">
              ¿Seguro que deseas eliminar{" "}
              <span className="font-semibold text-white">{transactionToDelete.merchant ?? "esta transacción"}</span>? Esta acción no se puede deshacer.
            </p>
            {deleteState.status === "error" && deleteState.message && (
              <p className="mt-3 text-xs text-rose-300">{deleteState.message}</p>
            )}
            <form action={deleteAction} className="mt-6 flex justify-end gap-2">
              <input type="hidden" name="transactionId" value={transactionToDelete.id} />
              <button
                type="button"
                onClick={() => setTransactionToDelete(null)}
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
