"use client";

import { useActionState, useState } from "react";
import { createNetWorthItemAction, deleteNetWorthItemAction, updateNetWorthItemAction } from "@/app/actions/net-worth-actions";
import { initialActionState } from "@/app/actions/action-state";
import { NetWorthCategory, NetWorthItem } from "@/domain/net-worth/net-worth";
import { formatCurrency } from "@/lib/format";
import { AmountInput } from "@/components/forms/amount-input";

interface NetWorthColumnProps {
  category: NetWorthCategory;
  title: string;
  subtitle: string;
  snapshotId: string;
  currency: string;
  items: NetWorthItem[];
}

export function NetWorthColumn({ category, title, subtitle, snapshotId, currency, items }: NetWorthColumnProps) {
  const [state, formAction] = useActionState(createNetWorthItemAction, initialActionState);

  return (
    <section className="flex h-full flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">{subtitle}</p>
        <h3 className="text-xl font-semibold text-white">{title}</h3>
      </div>

      <form action={formAction} className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
        <input type="hidden" name="snapshotId" value={snapshotId} />
        <input type="hidden" name="category" value={category} />
        <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
          Nombre
          <input
            name="name"
            placeholder="Cuenta ahorro"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
          Monto
          <AmountInput
            name="amount"
            placeholder="0.00"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
          Entidad
          <input
            name="entity"
            placeholder="Banco, institución, etc."
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
          Nota
          <input
            name="note"
            placeholder="Opcional"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
          />
        </label>
        {state.message && (
          <p className={`text-xs ${state.status === "success" ? "text-emerald-300" : "text-rose-300"}`}>
            {state.message}
          </p>
        )}
        <button type="submit" className="w-full rounded-full bg-white/90 px-3 py-2 text-sm font-semibold text-slate-900">
          Agregar
        </button>
      </form>

      <div className="flex flex-col gap-3">
        {items.length === 0 ? (
          <p className="text-sm text-slate-300">Aún no agregas elementos en esta categoría.</p>
        ) : (
          items.map((item) => <NetWorthItemRow key={item.id} item={item} currency={currency} />)
        )}
      </div>
    </section>
  );
}

interface NetWorthItemRowProps {
  item: NetWorthItem;
  currency: string;
}

function NetWorthItemRow({ item, currency }: NetWorthItemRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [updateState, updateAction] = useActionState(updateNetWorthItemAction, initialActionState);
  const [deleteState, deleteAction] = useActionState(deleteNetWorthItemAction, initialActionState);

  if (isEditing) {
    return (
      <form action={updateAction} className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
        <input type="hidden" name="id" value={item.id} />
        <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
          Nombre
          <input
            name="name"
            defaultValue={item.name}
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
          Monto
          <AmountInput
            name="amount"
            defaultValue={item.amount}
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
          Entidad
          <input
            name="entity"
            defaultValue={item.entity ?? ""}
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
          Nota
          <input
            name="note"
            defaultValue={item.note ?? ""}
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
          />
        </label>
        {updateState.message && (
          <p className={`text-xs ${updateState.status === "success" ? "text-emerald-300" : "text-rose-300"}`}>
            {updateState.message}
          </p>
        )}
        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="flex-1 rounded-full bg-white/90 px-3 py-2 text-sm font-semibold text-slate-900"
          >
            Guardar
          </button>
          <button
            type="button"
            className="flex-1 rounded-full border border-white/20 px-3 py-2 text-sm font-semibold text-white"
            onClick={() => setIsEditing(false)}
          >
            Cancelar
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-white">{item.name}</p>
          {item.entity ? <p className="text-xs text-slate-300">{item.entity}</p> : null}
          {item.note ? <p className="text-xs text-slate-400">{item.note}</p> : null}
        </div>
        <p className="text-sm font-semibold text-white">{formatCurrency(item.amount, currency)}</p>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white"
          onClick={() => setIsEditing(true)}
        >
          Editar
        </button>
        <form
          action={deleteAction}
          onSubmit={(event) => {
            if (!window.confirm("¿Eliminar este ítem?")) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="id" value={item.id} />
          <button type="submit" className="rounded-full border border-rose-300/40 px-3 py-1 text-xs font-semibold text-rose-200">
            Eliminar
          </button>
        </form>
      </div>
      {deleteState.message && (
        <p className={`mt-2 text-xs ${deleteState.status === "success" ? "text-emerald-300" : "text-rose-300"}`}>
          {deleteState.message}
        </p>
      )}
    </div>
  );
}
