"use client";

import { useActionState, useMemo, useState, type ReactNode } from "react";
import clsx from "clsx";
import { Category } from "@/domain/categories/category";
import { Transaction } from "@/domain/transactions/transaction";
import { deleteTransactionAction } from "@/app/actions/delete-transaction-action";
import { updateTransactionAction } from "@/app/actions/update-transaction-action";
import { initialActionState, type ActionState } from "@/app/actions/action-state";
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
  const enhancedUpdateAction = async (prev: ActionState, formData: FormData) => {
    const result = await updateTransactionAction(prev, formData);
    if (result.status === "success") {
      setIsEditing(false);
    }
    return result;
  };
  const [formState, formAction] = useActionState(enhancedUpdateAction, initialActionState);
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

  const handleDeleteAction = (formData: FormData) => {
    setTransactionToDelete(null);
    deleteAction(formData);
  };

  return (
    <div className="text-xs">
      <div className="flex items-center justify-end gap-2">
        <IconActionButton
          onClick={() => setIsEditing((prev) => !prev)}
          label={isEditing ? "Cerrar edición" : "Editar transacción"}
          ariaPressed={isEditing}
        >
          <EditIcon />
        </IconActionButton>
        <IconActionButton
          onClick={() => setTransactionToDelete(transaction)}
          label="Eliminar transacción"
          tone="danger"
        >
          <TrashIcon />
        </IconActionButton>
      </div>
      {deleteState.status === "error" && <p className="text-rose-300">{deleteState.message}</p>}
      {isEditing && (
        <form action={formAction} className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
          <input type="hidden" name="transactionId" value={transaction.id} />
          <label className="flex flex-col gap-1 text-[11px] uppercase tracking-wide text-slate-400">
            Descripción
            <input
              type="text"
              name="merchant"
              defaultValue={transaction.merchant ?? ""}
              placeholder="Nombre del comercio o nota"
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-1 text-white placeholder:text-slate-400"
            />
          </label>
          <label className="flex flex-col gap-1 text-[11px] uppercase tracking-wide text-slate-400">
            Fecha
            <input
              type="date"
              name="date"
              defaultValue={format(transaction.date, "yyyy-MM-dd")}
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-1 text-white date-input"
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
            <form action={handleDeleteAction} className="mt-6 flex justify-end gap-2">
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

function IconActionButton({
  children,
  label,
  onClick,
  tone = "default",
  ariaPressed,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  tone?: "default" | "danger";
  ariaPressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ariaPressed}
      title={label}
      className={clsx(
        "h-8 w-8 rounded-full border px-2 py-2 text-white transition hover:border-white/60",
        tone === "danger"
          ? "border-rose-300/80 text-rose-100 hover:bg-rose-500/10"
          : "border-white/20 hover:bg-white/10",
        ariaPressed ? "bg-white/20" : "",
      )}
    >
      <span className="sr-only">{label}</span>
      <div className="flex h-full w-full items-center justify-center">{children}</div>
    </button>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm14.71-9.04a1.003 1.003 0 0 0 0-1.42l-2.5-2.5a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.99-1.66z"
        fill="currentColor"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M6 7h12v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7zm9-4v3H9V3h6zm-8 3H5V5h4V3h6v2h4v1h-2v13a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V6H7z"
        fill="currentColor"
      />
    </svg>
  );
}
