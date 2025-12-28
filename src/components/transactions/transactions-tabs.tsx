"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import clsx from "clsx";
import { format } from "date-fns";
import { Category } from "@/domain/categories/category";
import { Transaction } from "@/domain/transactions/transaction";
import { ScheduledTransaction } from "@/domain/scheduled-transactions/scheduled-transaction";
import { TransactionDraft } from "@/domain/transaction-drafts/transaction-draft";
import { formatCurrency } from "@/lib/format";
import { TransactionForm } from "@/components/forms/transaction-form";
import { TransactionActions } from "@/components/transactions/transaction-actions";
import { ScheduledTransactionForm } from "@/components/forms/scheduled-transaction-form";
import { deleteScheduledTransactionAction } from "@/app/actions/scheduled-transaction-actions";
import { approveDraftAction, deleteDraftAction } from "@/app/actions/draft-transaction-actions";
import { initialActionState } from "@/app/actions/action-state";
import { importEmailsAction } from "@/app/actions/import-email-actions";
import { useRouter } from "next/navigation";

const bucketOptions = [
  { value: "NEEDS", label: "Needs" },
  { value: "WANTS", label: "Wants" },
  { value: "SAVINGS", label: "Savings" },
] as const;

interface TransactionsTabsProps {
  manual: Transaction[];
  scheduled: ScheduledTransaction[];
  drafts: TransactionDraft[];
  categories: Category[];
}

const tabs = [
  { id: "manual", label: "Manual" },
  { id: "scheduled", label: "Programadas" },
  { id: "drafts", label: "Borradores automáticos" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function TransactionsTabs({ manual, scheduled, drafts, categories }: TransactionsTabsProps) {
  const [active, setActive] = useState<TabId>("manual");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex w-full gap-2 rounded-full border border-white/10 bg-white/5 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={clsx(
              "flex-1 rounded-full px-4 py-2 text-sm font-semibold transition",
              active === tab.id ? "bg-white text-slate-900" : "text-slate-200 hover:bg-white/5",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {active === "manual" && <ManualPanel manual={manual} categories={categories} />}
      {active === "scheduled" && <ScheduledPanel scheduled={scheduled} categories={categories} />}
      {active === "drafts" && <DraftsPanel drafts={drafts} categories={categories} />}
    </div>
  );
}

function ManualPanel({ manual, categories }: { manual: Transaction[]; categories: Category[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <TransactionForm categories={categories} />
      <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
        <h2 className="text-xl font-semibold">Transacciones registradas</h2>
        <div className="mt-4 space-y-4">
          {manual.map((transaction) => (
            <div key={transaction.id} className="flex items-start justify-between gap-4 border-b border-white/5 pb-4 last:border-b-0">
              <div>
                <p className="font-medium">{transaction.merchant ?? "Sin descripción"}</p>
                <p className="text-xs text-slate-400">
                  {format(transaction.date, "dd MMM yyyy")} · {transaction.bucket} · {transaction.source}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={clsx(
                    "text-lg font-semibold",
                    transaction.amount >= 0 ? "text-emerald-300" : "text-rose-300",
                  )}
                >
                  {formatCurrency(transaction.amount, transaction.currency)}
                </p>
                <TransactionActions transaction={transaction} categories={categories} />
              </div>
            </div>
          ))}
          {!manual.length && <p className="text-sm text-slate-400">Aún no tienes transacciones en este mes.</p>}
        </div>
      </article>
    </div>
  );
}

function ScheduledPanel({ scheduled, categories }: { scheduled: ScheduledTransaction[]; categories: Category[] }) {
  const [deleteState, deleteAction] = useActionState(deleteScheduledTransactionAction, initialActionState);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ScheduledTransactionForm categories={categories} />
      <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
        <h2 className="text-xl font-semibold">Planes programados</h2>
        <div className="mt-4 space-y-3">
          {scheduled.map((plan) => (
            <div key={plan.id} className="rounded-xl border border-white/10 p-4 text-sm">
              <p className="font-semibold">{plan.name}</p>
              <p className="text-xs text-slate-400">
                Próxima ejecución: {format(plan.nextRunDate, "dd MMM yyyy")} · {plan.recurrence}
              </p>
              <p className="text-sm text-slate-200">{formatCurrency(plan.amount, plan.currency)}</p>
              <form action={deleteAction} className="mt-2 text-right">
                <input type="hidden" name="scheduledId" value={plan.id} />
                <button type="submit" className="text-xs text-rose-300">Eliminar</button>
              </form>
            </div>
          ))}
          {!scheduled.length && <p className="text-sm text-slate-400">No hay pagos programados aún.</p>}
          {deleteState.message && (
            <p className={`text-xs ${deleteState.status === "success" ? "text-emerald-300" : "text-rose-300"}`}>
              {deleteState.message}
            </p>
          )}
        </div>
      </article>
    </div>
  );
}

function DraftsPanel({ drafts, categories }: { drafts: TransactionDraft[]; categories: Category[] }) {
  const router = useRouter();
  const [importState, setImportState] = useState<{
    status: "idle" | "success" | "error";
    message?: string;
    details?: string[];
  }>({
    status: "idle",
  });
  const [isPending, startTransition] = useTransition();

  const handleManualImport = () => {
    startTransition(async () => {
      const result = await importEmailsAction();
      setImportState(result);
      if (result.status === "success") {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold text-white">Sincronizar correos ahora</p>
          <p className="text-xs text-slate-400">
            Ejecuta la ingesta manualmente si el cron aún no se ha disparado. Usa esto solo cuando necesites forzar la actualización.
          </p>
        </div>
        <button
          type="button"
          onClick={handleManualImport}
          disabled={isPending}
          className={clsx(
            "rounded-full px-5 py-2 text-sm font-semibold transition",
            isPending ? "bg-white/30 text-slate-300" : "bg-white text-slate-900 hover:bg-slate-100",
          )}
        >
          {isPending ? "Sincronizando..." : "Obtener correos"}
        </button>
      </div>
      {importState.message ? (
        <div className="space-y-1 rounded-xl border border-white/5 bg-slate-900/20 p-3">
          <p
            className={clsx(
              "text-xs",
              importState.status === "success" ? "text-emerald-300" : "text-rose-300",
            )}
          >
            {importState.message}
          </p>
          {importState.details?.length ? (
            <ul className="list-disc space-y-1 pl-4 text-[11px] text-slate-400">
              {importState.details.map((detail, index) => (
                <li key={`${detail}-${index}`}>{detail}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      {drafts.map((draft) => (
        <DraftCard key={draft.id} draft={draft} categories={categories} />
      ))}
      {!drafts.length && <p className="text-sm text-slate-400">No hay borradores pendientes.</p>}
    </div>
  );
}

type ContactLike = { name?: string; email?: string };

function DraftCard({ draft, categories }: { draft: TransactionDraft; categories: Category[] }) {
  const [approveState, approveAction] = useActionState(approveDraftAction, initialActionState);
  const [deleteState, deleteAction] = useActionState(deleteDraftAction, initialActionState);
  const [bucket, setBucket] = useState<"NEEDS" | "WANTS" | "SAVINGS">(draft.bucket);
  const [categoryId, setCategoryId] = useState(draft.categoryId ?? "");
  const [isEditing, setIsEditing] = useState(false);

  const bucketCategories = useMemo(
    () => categories.filter((category) => category.bucket === bucket),
    [categories, bucket],
  );

  const resolvedCategoryId = useMemo(() => {
    if (!bucketCategories.length) {
      return "";
    }
    if (categoryId && bucketCategories.some((category) => category.id === categoryId)) {
      return categoryId;
    }
    return bucketCategories[0]?.id ?? "";
  }, [bucketCategories, categoryId]);

  const canApprove = bucketCategories.length > 0 && Boolean(resolvedCategoryId);
  const rawPayload = (draft.rawPayload ?? {}) as Record<string, unknown>;
  const forwardedByValue = (rawPayload as { forwardedBy?: unknown }).forwardedBy;
  const recipientsValue = (rawPayload as { recipients?: unknown }).recipients;
  const adapterValue = (rawPayload as { adapter?: unknown }).adapter;
  const subjectValue = (rawPayload as { messageSubject?: unknown }).messageSubject;
  const snippetValue = (rawPayload as { messageSnippet?: unknown }).messageSnippet;

  const forwardedBy = isContact(forwardedByValue) ? forwardedByValue : undefined;
  const recipients: ContactLike[] = Array.isArray(recipientsValue)
    ? (recipientsValue as unknown[]).filter(isContact)
    : [];
  const adapterLabel = formatAdapterLabel(adapterValue, draft.source);
  const messageSubject = typeof subjectValue === "string" ? subjectValue : undefined;
  const messageSnippet = typeof snippetValue === "string" ? snippetValue : undefined;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold">{draft.merchant ?? "Borrador sin descripción"}</p>
          <p className="text-xs text-slate-400">
            {format(draft.date, "dd MMM yyyy")} · {draft.bucket} · {adapterLabel}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-rose-300">{formatCurrency(draft.amount, draft.currency)}</p>
          <p className="text-[11px] uppercase tracking-wide text-slate-400">{draft.currency}</p>
        </div>
      </div>
      {(forwardedBy || recipients.length > 0 || messageSubject || messageSnippet) && (
        <div className="mt-3 rounded-xl border border-white/10 bg-slate-900/30 p-3 text-xs text-slate-300">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Contexto del correo</p>
          {forwardedBy && (
            <p className="mt-1">
              <span className="text-slate-400">Reenviado por:</span> {formatContact(forwardedBy)}
            </p>
          )}
          {recipients.length > 0 && (
            <p className="mt-1">
              <span className="text-slate-400">Destinatarios:</span> {recipients.map(formatContact).join(", ")}
            </p>
          )}
          {messageSubject && (
            <p className="mt-1">
              <span className="text-slate-400">Asunto:</span> {messageSubject}
            </p>
          )}
          {messageSnippet && (
            <p className="mt-1 text-slate-400">
              “{messageSnippet}”
            </p>
          )}
        </div>
      )}
      {!isEditing ? (
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded-full bg-white/90 px-4 py-1 text-xs font-semibold text-slate-900"
          >
            Revisar y aprobar
          </button>
          <form action={deleteAction}>
            <input type="hidden" name="draftId" value={draft.id} />
            <button className="rounded-full border border-white/20 px-4 py-1 text-xs text-white" type="submit">
              Descartar
            </button>
          </form>
        </div>
      ) : (
        <>
          <form action={approveAction} className="mt-4 grid gap-3 md:grid-cols-2">
            <input type="hidden" name="draftId" value={draft.id} />
            <label className="flex flex-col gap-1 text-[11px] uppercase tracking-wide text-slate-400">
              Fecha
              <input type="date" name="date" defaultValue={format(draft.date, "yyyy-MM-dd")} className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white" />
            </label>
        <label className="flex flex-col gap-1 text-[11px] uppercase tracking-wide text-slate-400">
          Monto
          <input
            type="number"
            step="0.01"
            name="amount"
            defaultValue={Math.abs(draft.amount)}
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
          />
        </label>
            <label className="flex flex-col gap-1 text-[11px] uppercase tracking-wide text-slate-400">
              Bucket
              <select
                name="bucket"
                value={bucket}
                onChange={(event) => setBucket(event.target.value as typeof bucket)}
                className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
              >
                {bucketOptions.map((option) => (
                  <option key={option.value} value={option.value} className="text-slate-900">
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-[11px] uppercase tracking-wide text-slate-400">
              Categoría
              <select
                name="categoryId"
                value={resolvedCategoryId}
                disabled={!bucketCategories.length}
                onChange={(event) => setCategoryId(event.target.value)}
                className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                required={bucketCategories.length > 0}
              >
                <option value="" disabled hidden>
                  Selecciona
                </option>
                {bucketCategories.map((category) => (
                  <option key={category.id} value={category.id} className="text-slate-900">
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-[11px] uppercase tracking-wide text-slate-400">
              Comercio
              <input name="merchant" defaultValue={draft.merchant ?? ""} className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white" />
            </label>
            <label className="flex flex-col gap-1 text-[11px] uppercase tracking-wide text-slate-400">
              Moneda
              <input name="currency" defaultValue={draft.currency} className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white" />
            </label>
            <div className="md:col-span-2 space-y-2">
              {!bucketCategories.length ? (
                <p className="text-xs text-rose-300">
                  Este bucket no tiene categorías. Asegúrate de definirlas en Presupuesto antes de aprobar este gasto.
                </p>
              ) : null}
              <div className="flex flex-col gap-2 md:flex-row">
                <button
                  className="flex-1 rounded-full bg-emerald-400/90 px-4 py-2 text-sm font-semibold text-slate-900 disabled:cursor-not-allowed disabled:bg-white/20"
                  type="submit"
                  disabled={!canApprove}
                >
                  Aprobar
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white"
                  onClick={() => setIsEditing(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </form>
          <form action={deleteAction} className="mt-2 text-right">
            <input type="hidden" name="draftId" value={draft.id} />
            <button className="rounded-full border border-white/20 px-4 py-1 text-xs text-white" type="submit">
              Descartar
            </button>
          </form>
        </>
      )}
      {approveState.message && (
        <p className={`mt-2 text-xs ${approveState.status === "success" ? "text-emerald-300" : "text-rose-300"}`}>{approveState.message}</p>
      )}
      {deleteState.message && (
        <p className={`mt-2 text-xs ${deleteState.status === "success" ? "text-emerald-300" : "text-rose-300"}`}>{deleteState.message}</p>
      )}
    </div>
  );
}

function formatContact(contact?: ContactLike) {
  if (!contact) {
    return "Desconocido";
  }
  if (contact.name && contact.email) {
    return `${contact.name} <${contact.email}>`;
  }
  return contact.name ?? contact.email ?? "Desconocido";
}

function isContact(value: unknown): value is ContactLike {
  if (!value || typeof value !== "object") {
    return false;
  }
  const contact = value as ContactLike;
  return Boolean(contact.email || contact.name);
}

function formatAdapterLabel(adapter: unknown, fallback?: string | null) {
  if (typeof adapter === "string" && adapter.trim().length > 0) {
    return adapter.replace(/-/g, " ");
  }
  return fallback ?? "EMAIL";
}
