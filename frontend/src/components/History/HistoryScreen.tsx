"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CircleAlert,
  LoaderCircle,
  Pencil,
  ReceiptText,
  Search,
  Trash2,
} from "lucide-react";

import { RequireAuth } from "@/components/Auth/RequireAuth";
import { expenseApi, getApiErrorMessage } from "@/lib/api";
import type { CurrencyCode, Expense } from "@/lib/api.types";
import { formatCurrency } from "@/lib/format";
import { useAuthStore } from "@/store/authStore";

import { ExpenseEditModal } from "./ExpenseEditModal";
import type { ExpenseUpdateFormValues } from "./ExpenseEditModal.types";
import type { ExpenseGroup } from "./HistoryScreen.types";

const pageSize = 50;

function createExpenseGroups(expenses: Expense[]): ExpenseGroup[] {
  const groups = new Map<string, Expense[]>();

  for (const expense of expenses) {
    // ISO date keys keep the grouping stable regardless of the browser's locale formatting.
    const dateKey = expense.transactionDate.slice(0, 10);
    groups.set(dateKey, [...(groups.get(dateKey) ?? []), expense]);
  }

  return Array.from(groups, ([dateKey, groupedExpenses]) => ({
    dateKey,
    label: new Intl.DateTimeFormat("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(`${dateKey}T12:00:00`)),
    expenses: groupedExpenses,
  }));
}

export function HistoryScreen() {
  const user = useAuthStore((state) => state.user);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [search, setSearch] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadExpenses = useCallback(async (requestedPage = 1) => {
    try {
      setError(null);
      const result = await expenseApi.list(requestedPage, pageSize);
      setExpenses((current) =>
        requestedPage === 1 ? result.data : [...current, ...result.data],
      );
      setPage(result.pagination.page);
      setTotalPages(result.pagination.totalPages);
    } catch (loadError: unknown) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      void loadExpenses();
    }
  }, [loadExpenses, user]);

  const filteredExpenses = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("tr-TR");

    return expenses.filter((expense) => {
      const matchesSearch =
        !normalizedSearch ||
        expense.description.toLocaleLowerCase("tr-TR").includes(normalizedSearch);
      const matchesCurrency = currency === "ALL" || expense.currency === currency;
      return matchesSearch && matchesCurrency;
    });
  }, [currency, expenses, search]);

  const expenseGroups = useMemo(
    () => createExpenseGroups(filteredExpenses),
    [filteredExpenses],
  );

  async function handleDelete(expense: Expense) {
    if (!window.confirm(`“${expense.description}” harcaması silinsin mi?`)) {
      return;
    }

    try {
      setError(null);
      await expenseApi.delete(expense.id);
      setExpenses((current) => current.filter((item) => item.id !== expense.id));
    } catch (deleteError: unknown) {
      setError(getApiErrorMessage(deleteError));
    }
  }

  async function handleUpdate(changes: ExpenseUpdateFormValues) {
    if (!editingExpense) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      const updatedExpense = await expenseApi.update(editingExpense.id, changes);
      setExpenses((current) =>
        current
          .map((expense) => (expense.id === updatedExpense.id ? updatedExpense : expense))
          .sort(
            (first, second) =>
              new Date(second.transactionDate).getTime() -
              new Date(first.transactionDate).getTime(),
          ),
      );
      setEditingExpense(null);
    } catch (updateError: unknown) {
      setError(getApiErrorMessage(updateError));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <RequireAuth>
      <div className="page-enter pb-4 pt-4">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-coral">Harcama günlüğü</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.055em]">Geçmiş</h1>
        <p className="mt-2 text-sm text-muted">Kayıtlarını bul, düzenle veya listenden kaldır.</p>

        <section className="mt-6 grid gap-3 sm:grid-cols-[1fr_10rem]">
          <label className="flex h-13 items-center gap-3 rounded-2xl border border-line bg-paper px-4 card-shadow">
            <Search aria-hidden="true" className="shrink-0 text-muted" size={18} />
            <span className="sr-only">Harcamalarda ara</span>
            <input
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/70"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Açıklamada ara"
              type="search"
              value={search}
            />
          </label>
          <label>
            <span className="sr-only">Para birimine göre filtrele</span>
            <select
              className="h-13 w-full rounded-2xl border border-line bg-paper px-4 text-sm font-semibold outline-none card-shadow focus:border-forest"
              onChange={(event) => setCurrency(event.target.value as CurrencyCode | "ALL")}
              value={currency}
            >
              <option value="ALL">Tüm kurlar</option>
              <option value="TRY">TRY</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </label>
        </section>

        {error ? (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-coral/25 bg-coral/10 p-4 text-sm" role="alert">
            <CircleAlert aria-hidden="true" className="mt-0.5 shrink-0 text-coral" size={17} />
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="grid min-h-64 place-items-center text-muted">
            <LoaderCircle aria-hidden="true" className="animate-spin" size={24} />
          </div>
        ) : expenseGroups.length ? (
          <div className="mt-7 space-y-7">
            {expenseGroups.map((group) => (
              <section key={group.dateKey}>
                <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.13em] text-muted">
                  {group.label}
                </h2>
                <div className="overflow-hidden rounded-[1.75rem] border border-line bg-paper">
                  {group.expenses.map((expense, index) => (
                    <article
                      className={`flex items-center gap-3 p-4 ${index ? "border-t border-line/80" : ""}`}
                      key={expense.id}
                    >
                      <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-canvas text-forest">
                        <ReceiptText aria-hidden="true" size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-bold">{expense.description}</h3>
                        <p className="mt-1 text-xs text-muted">
                          {expense.currency !== "TRY"
                            ? `${formatCurrency(expense.originalAmount, expense.currency)} · `
                            : ""}
                          {formatCurrency(expense.amount, "TRY")}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          aria-label={`${expense.description} harcamasını düzenle`}
                          className="grid size-9 place-items-center rounded-xl text-muted transition hover:bg-canvas hover:text-forest"
                          onClick={() => setEditingExpense(expense)}
                          type="button"
                        >
                          <Pencil aria-hidden="true" size={16} />
                        </button>
                        <button
                          aria-label={`${expense.description} harcamasını sil`}
                          className="grid size-9 place-items-center rounded-xl text-muted transition hover:bg-coral/10 hover:text-coral"
                          onClick={() => void handleDelete(expense)}
                          type="button"
                        >
                          <Trash2 aria-hidden="true" size={16} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}

            {page < totalPages ? (
              <button
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-line bg-paper text-sm font-bold"
                disabled={isLoadingMore}
                onClick={() => {
                  setIsLoadingMore(true);
                  void loadExpenses(page + 1);
                }}
                type="button"
              >
                {isLoadingMore ? <LoaderCircle aria-hidden="true" className="animate-spin" size={17} /> : null}
                {isLoadingMore ? "Yükleniyor…" : "Daha fazla göster"}
              </button>
            ) : null}
          </div>
        ) : (
          <div className="mt-8 rounded-[1.75rem] border border-dashed border-line bg-paper/65 px-6 py-12 text-center">
            <ReceiptText aria-hidden="true" className="mx-auto text-muted" size={26} />
            <p className="mt-3 text-sm font-bold">Eşleşen harcama bulunamadı.</p>
            <p className="mt-1 text-xs text-muted">Arama veya filtre seçimini değiştirebilirsin.</p>
          </div>
        )}
      </div>

      {editingExpense ? (
        <ExpenseEditModal
          expense={editingExpense}
          isSaving={isSaving}
          onClose={() => setEditingExpense(null)}
          onSave={handleUpdate}
        />
      ) : null}
    </RequireAuth>
  );
}
