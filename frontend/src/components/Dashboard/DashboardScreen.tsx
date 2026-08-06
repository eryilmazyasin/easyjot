"use client";

import {
  ArrowUpRight,
  CircleAlert,
  LoaderCircle,
  Plus,
  ReceiptText,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { type FormEvent, useCallback, useEffect, useState } from "react";

import { RequireAuth } from "@/components/Auth/RequireAuth";
import { analyticsApi, expenseApi, getApiErrorMessage } from "@/lib/api";
import type { AnalyticsSummary } from "@/lib/api.types";
import { formatCurrency, formatExpenseDate } from "@/lib/format";
import { useAuthStore } from "@/store/authStore";

export function DashboardScreen() {
  const user = useAuthStore((state) => state.user);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    try {
      setError(null);
      setSummary(await analyticsApi.getSummary());
    } catch (loadError: unknown) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      void loadSummary();
    }
  }, [loadSummary, user]);

  const handleQuickAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!input.trim()) {
      return;
    }

    try {
      setIsAdding(true);
      setError(null);
      await expenseApi.quickAdd(input.trim());
      setInput("");
      await loadSummary();
    } catch (addError: unknown) {
      setError(getApiErrorMessage(addError));
    } finally {
      setIsAdding(false);
    }
  };

  const baseCurrency = summary?.baseCurrency ?? user?.baseCurrency ?? "TRY";
  const remainingBudget = summary?.remainingBudget;
  const usage = Math.min(Math.max(summary?.budgetUsagePercentage ?? 0, 0), 100);

  return (
    <RequireAuth>
      <div className="page-enter space-y-6 pb-4 pt-4">
        <section>
          <p className="text-sm font-medium text-muted">Merhaba,</p>
          <h1 className="mt-1 text-3xl font-bold tracking-[-0.055em] sm:text-4xl">
            Bugün ne harcadın?
          </h1>
        </section>

        <section className="card-shadow overflow-hidden rounded-[2rem] bg-forest p-6 text-paper sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-paper/60">
                Kalan bütçe
              </p>
              <p className="mt-2 text-4xl font-bold tracking-[-0.06em]">
                {isLoading
                  ? "—"
                  : remainingBudget === null || remainingBudget === undefined
                    ? "Bütçe yok"
                    : formatCurrency(remainingBudget, baseCurrency)}
              </p>
            </div>
            <div className="grid size-11 place-items-center rounded-2xl bg-paper/10">
              <ArrowUpRight className="size-5 text-lime" aria-hidden="true" />
            </div>
          </div>

          <div className="mt-8 h-2 overflow-hidden rounded-full bg-paper/15">
            <div
              className={`h-full rounded-full transition-[width] duration-500 ${
                (summary?.budgetUsagePercentage ?? 0) > 100 ? "bg-coral" : "bg-lime"
              }`}
              style={{ width: `${usage}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-paper/65">
            <span>
              Harcanan {summary ? formatCurrency(summary.totalSpent, baseCurrency) : "—"}
            </span>
            <span>
              {summary?.budgetUsagePercentage === null
                ? "Limit tanımla"
                : `%${summary?.budgetUsagePercentage ?? 0}`}
            </span>
          </div>
        </section>

        <form onSubmit={handleQuickAdd} className="rounded-[2rem] border border-line bg-paper p-3 card-shadow">
          <label htmlFor="quick-expense" className="sr-only">
            Harcamanı tek cümleyle yaz
          </label>
          <div className="flex items-center gap-2">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-canvas text-coral">
              <Sparkles className="size-5" aria-hidden="true" />
            </div>
            <input
              id="quick-expense"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder='"Taksi 150" yaz ve ekle'
              autoFocus
              autoComplete="off"
              enterKeyHint="done"
              className="h-12 min-w-0 flex-1 bg-transparent px-1 text-base font-semibold outline-none placeholder:font-medium placeholder:text-muted/65"
            />
            <button
              type="submit"
              disabled={isAdding || !input.trim()}
              className="grid size-11 shrink-0 place-items-center rounded-2xl bg-coral text-white transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Harcamayı ekle"
            >
              {isAdding ? (
                <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="size-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </form>

        {error ? (
          <div className="flex items-start gap-3 rounded-2xl border border-coral/25 bg-coral/10 p-4 text-sm text-ink" role="alert">
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-coral" aria-hidden="true" />
            {error}
          </div>
        ) : null}

        <section>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Hareketler</p>
              <h2 className="mt-1 text-xl font-bold tracking-[-0.035em]">Son harcamalar</h2>
            </div>
            <Link href="/history" className="text-sm font-bold text-coral">
              Tümünü gör
            </Link>
          </div>

          <div className="overflow-hidden rounded-[1.75rem] border border-line bg-paper">
            {isLoading ? (
              <div className="grid min-h-36 place-items-center text-muted">
                <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
              </div>
            ) : summary?.recentExpenses.length ? (
              summary.recentExpenses.map((expense, index) => (
                <article
                  key={expense.id}
                  className={`flex items-center gap-3 px-4 py-4 ${index ? "border-t border-line/80" : ""}`}
                >
                  <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-canvas text-forest">
                    <ReceiptText className="size-[1.1rem]" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-bold">{expense.description}</h3>
                    <p className="mt-0.5 text-xs text-muted">
                      {formatExpenseDate(expense.transactionDate)} · {expense.currency}
                    </p>
                  </div>
                  <p className="text-sm font-bold tracking-[-0.02em]">
                    −{formatCurrency(expense.amountInBaseCurrency, expense.baseCurrency)}
                  </p>
                </article>
              ))
            ) : (
              <div className="px-6 py-10 text-center">
                <ReceiptText className="mx-auto size-6 text-muted" aria-hidden="true" />
                <p className="mt-3 text-sm font-semibold">Bu ay henüz harcama yok.</p>
                <p className="mt-1 text-xs text-muted">İlk kaydını yukarıdaki alandan ekle.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </RequireAuth>
  );
}
