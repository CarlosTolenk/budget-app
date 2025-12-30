"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import clsx from "clsx";
import { format } from "date-fns";
import { Category } from "@/domain/categories/category";
import { Transaction, TransactionSource } from "@/domain/transactions/transaction";
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

const sourceDisplay: Record<TransactionSource, { label: string; badgeClass: string }> = {
  MANUAL: { label: "Manual", badgeClass: "bg-slate-100/10 text-slate-100" },
  EMAIL: { label: "Correo", badgeClass: "bg-emerald-400/10 text-emerald-200" },
  SCHEDULED: { label: "Programada", badgeClass: "bg-sky-400/10 text-sky-200" },
};

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
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | string>("all");
  const [bucketFilter, setBucketFilter] = useState<"all" | (typeof bucketOptions)[number]["value"]>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [page, setPage] = useState(1);

  const pageSize = 8;

  const categoryNameMap = useMemo(() => {
    return categories.reduce<Record<string, string>>((acc, category) => {
      acc[category.id] = category.name;
      return acc;
    }, {});
  }, [categories]);

  const filteredTransactions = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();
    const min = minAmount ? Number(minAmount) : undefined;
    const max = maxAmount ? Number(maxAmount) : undefined;
    const minValue = typeof min === "number" && !Number.isNaN(min) ? Math.abs(min) : undefined;
    const maxValue = typeof max === "number" && !Number.isNaN(max) ? Math.abs(max) : undefined;
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    if (start) {
      start.setHours(0, 0, 0, 0);
    }
    if (end) {
      end.setHours(23, 59, 59, 999);
    }

    return [...manual]
      .filter((transaction) => {
        if (categoryFilter !== "all" && transaction.categoryId !== categoryFilter) {
          return false;
        }
        if (bucketFilter !== "all" && transaction.bucket !== bucketFilter) {
          return false;
        }
        if (normalizedTerm) {
          const descriptor = transaction.merchant ?? "Sin descripción";
          if (!descriptor.toLowerCase().includes(normalizedTerm)) {
            return false;
          }
        }
        if (start && transaction.date < start) {
          return false;
        }
        if (end && transaction.date > end) {
          return false;
        }
        const normalizedAmount = Math.abs(transaction.amount);
        if (typeof minValue === "number" && normalizedAmount < minValue) {
          return false;
        }
        if (typeof maxValue === "number" && normalizedAmount > maxValue) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [manual, searchTerm, categoryFilter, bucketFilter, startDate, endDate, minAmount, maxAmount]);

  const filteredTotalAmount = filteredTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const filteredCurrency = filteredTransactions[0]?.currency ?? manual[0]?.currency ?? "USD";
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(startIndex, startIndex + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      <TransactionForm categories={categories} />
      <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Transacciones registradas</h2>
            <p className="text-sm text-slate-400">Filtra y navega tus movimientos manuales fácilmente.</p>
          </div>
          <div className="text-xs text-slate-300 space-y-1 text-right">
            <p>Mostrando {filteredTransactions.length} de {manual.length} transacciones</p>
            <p className="font-semibold text-white">
              Total filtrado: {formatCurrency(filteredTotalAmount, filteredCurrency)}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <label className="text-xs text-slate-300">
            Búsqueda
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setPage(1);
              }}
              placeholder="Descripción o comercio"
              className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-white/40 focus:outline-none"
            />
          </label>

          <label className="text-xs text-slate-300">
            Categoría
            <select
              value={categoryFilter}
              onChange={(event) => {
                setCategoryFilter(event.target.value as typeof categoryFilter);
                setPage(1);
              }}
              className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-white focus:border-white/40 focus:outline-none"
            >
              <option value="all">Todas</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs text-slate-300">
            Bucket
            <select
              value={bucketFilter}
              onChange={(event) => {
                setBucketFilter(event.target.value as typeof bucketFilter);
                setPage(1);
              }}
              className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-white focus:border-white/40 focus:outline-none"
            >
              <option value="all">Todos</option>
              {bucketOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs text-slate-300">
            Desde
            <input
              type="date"
              value={startDate}
              onChange={(event) => {
                setStartDate(event.target.value);
                setPage(1);
              }}
              className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-white focus:border-white/40 focus:outline-none"
            />
          </label>

          <label className="text-xs text-slate-300">
            Hasta
            <input
              type="date"
              value={endDate}
              onChange={(event) => {
                setEndDate(event.target.value);
                setPage(1);
              }}
              className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-white focus:border-white/40 focus:outline-none"
            />
          </label>

          <label className="text-xs text-slate-300">
            Monto mínimo
            <input
              type="number"
              value={minAmount}
              onChange={(event) => {
                setMinAmount(event.target.value);
                setPage(1);
              }}
              placeholder="0"
              className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-white/40 focus:outline-none"
            />
          </label>
          <label className="text-xs text-slate-300">
            Monto máximo
            <input
              type="number"
              value={maxAmount}
              onChange={(event) => {
                setMaxAmount(event.target.value);
                setPage(1);
              }}
              placeholder="0"
              className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-white/40 focus:outline-none"
            />
          </label>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-3 pr-4 font-medium">Descripción</th>
                <th className="pb-3 pr-4 font-medium">Categoría</th>
                <th className="pb-3 pr-4 font-medium">Origen</th>
                <th className="pb-3 pr-4 font-medium">Fecha</th>
                <th className="pb-3 pr-4 font-medium text-right">Monto</th>
                <th className="pb-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTransactions.map((transaction) => {
                const categoryLabel = transaction.categoryId
                  ? categoryNameMap[transaction.categoryId] ?? "Sin categoría"
                  : "Sin categoría";
                const sourceInfo = sourceDisplay[transaction.source] ?? sourceDisplay.MANUAL;
                return (
                  <tr key={transaction.id} className="border-t border-white/5 text-sm last:border-b last:border-white/5">
                    <td className="py-3 pr-4 align-top">
                      <p className="font-semibold text-white">{transaction.merchant ?? "Sin descripción"}</p>
                      <p className="text-xs text-slate-400">{transaction.bucket}</p>
                    </td>
                    <td className="py-3 pr-4 align-top text-slate-100">{categoryLabel}</td>
                    <td className="py-3 pr-4 align-top">
                      <span
                        className={clsx(
                          "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                          sourceInfo.badgeClass,
                        )}
                      >
                        {sourceInfo.label}
                      </span>
                    </td>
                    <td className="py-3 pr-4 align-top text-slate-100">{format(transaction.date, "dd MMM yyyy")}</td>
                    <td
                      className={clsx(
                        "py-3 pr-4 text-right font-semibold",
                        transaction.amount >= 0 ? "text-emerald-300" : "text-rose-300",
                      )}
                    >
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </td>
                    <td className="py-3 text-right align-top">
                      <TransactionActions transaction={transaction} categories={categories} />
                    </td>
                  </tr>
                );
              })}
              {!paginatedTransactions.length && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-sm text-slate-400">
                    {manual.length
                      ? "No hay transacciones que coincidan con los filtros seleccionados."
                      : "Aún no tienes transacciones en este mes."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
            <span>
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                disabled={currentPage <= 1}
                className={clsx(
                  "rounded-full border border-white/20 px-4 py-2 font-semibold transition",
                  currentPage <= 1 ? "cursor-not-allowed opacity-40" : "hover:border-white/40",
                )}
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                disabled={currentPage >= totalPages}
                className={clsx(
                  "rounded-full border border-white/20 px-4 py-2 font-semibold transition",
                  currentPage >= totalPages ? "cursor-not-allowed opacity-40" : "hover:border-white/40",
                )}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
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
