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
import { disconnectGmailAction } from "@/app/actions/gmail-credential-actions";
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
  gmailConnectUrl: string;
  isGmailConnected: boolean;
}

const tabs = [
  { id: "manual", label: "Manual" },
  { id: "scheduled", label: "Programadas" },
  { id: "drafts", label: "Borradores automáticos" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function TransactionsTabs({
  manual,
  scheduled,
  drafts,
  categories,
  gmailConnectUrl,
  isGmailConnected,
}: TransactionsTabsProps) {
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
      {active === "drafts" && (
        <DraftsPanel
          drafts={drafts}
          categories={categories}
          gmailConnectUrl={gmailConnectUrl}
          isGmailConnected={isGmailConnected}
        />
      )}
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

function DraftsPanel({
  drafts,
  categories,
  gmailConnectUrl,
  isGmailConnected,
}: {
  drafts: TransactionDraft[];
  categories: Category[];
  gmailConnectUrl: string;
  isGmailConnected: boolean;
}) {
  const router = useRouter();
  const [importState, setImportState] = useState<{
    status: "idle" | "success" | "error";
    message?: string;
    details?: string[];
  }>({
    status: "idle",
  });
  const [isImportPending, startImportTransition] = useTransition();
  const [isDisconnectPending, startDisconnectTransition] = useTransition();
  const [isDisconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [disconnectState, setDisconnectState] = useState(initialActionState);

  const handleManualImport = () => {
    if (!isGmailConnected || isImportPending) {
      return;
    }
    startImportTransition(async () => {
      const result = await importEmailsAction();
      setImportState(result);
      if (result.status === "success") {
        router.refresh();
      }
    });
  };

  const openDisconnectModal = () => {
    setDisconnectState(initialActionState);
    setDisconnectModalOpen(true);
  };

  const closeDisconnectModal = () => {
    setDisconnectState(initialActionState);
    setDisconnectModalOpen(false);
  };

  const handleDisconnect = () => {
    startDisconnectTransition(async () => {
      const result = await disconnectGmailAction();
      setDisconnectState(result);
      if (result.status === "success") {
        setDisconnectModalOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-4">
      {isDisconnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/90 p-6 text-sm shadow-2xl" role="dialog" aria-modal="true">
            <p className="text-base font-semibold text-white">Desvincular cuenta de Gmail</p>
            <p className="mt-2 text-slate-300">
              ¿Estás seguro de que deseas desvincular tu correo? Los borradores automáticos dejarán de generarse hasta que vuelvas a vincularlo.
            </p>
            {disconnectState.status === "error" && disconnectState.message && (
              <p className="mt-3 text-xs text-rose-300">{disconnectState.message}</p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeDisconnectModal}
                className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/40"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={isDisconnectPending}
                className={clsx(
                  "rounded-full px-4 py-2 text-xs font-semibold transition",
                  isDisconnectPending
                    ? "border border-rose-200/50 text-rose-100"
                    : "bg-rose-500/90 text-white hover:bg-rose-500",
                )}
              >
                {isDisconnectPending ? "Desvinculando..." : "Desvincular"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold text-white">Sincronizar correos ahora</p>
          <p className="text-xs text-slate-400">
            Ejecuta la ingesta manualmente si el cron aún no se ha disparado. Usa esto solo cuando necesites forzar la actualización.
          </p>
        </div>
        <div className="flex flex-col gap-2 md:flex-row">
          <button
            type="button"
            onClick={handleManualImport}
            disabled={isImportPending || !isGmailConnected}
            className={clsx(
              "rounded-full px-5 py-2 text-sm font-semibold transition",
              !isGmailConnected
                ? "cursor-not-allowed border border-white/20 text-slate-400"
                : isImportPending
                  ? "bg-white/30 text-slate-300"
                  : "bg-white text-slate-900 hover:bg-slate-100",
            )}
          >
            {isImportPending ? "Buscando..." : "Buscar correos"}
          </button>
          {isGmailConnected ? (
            <button
              type="button"
              onClick={openDisconnectModal}
              className="rounded-full border border-rose-400/40 px-5 py-2 text-center text-sm font-semibold text-rose-100 transition hover:border-rose-200 hover:text-rose-50"
            >
              Desvincular Gmail
            </button>
          ) : (
            <a
              href={gmailConnectUrl}
              className="rounded-full border border-white/30 px-5 py-2 text-center text-sm font-semibold text-white transition hover:border-white/60"
            >
              Vincular Gmail
            </a>
          )}
        </div>
      </div>
      <p className="text-[11px] text-slate-400">
        Conecta tu cuenta de Gmail para que los correos con notificaciones bancarias se conviertan en borradores automáticos.
      </p>
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
