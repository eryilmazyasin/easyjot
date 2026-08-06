"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { CalendarDays, Save, X } from "lucide-react";

import type { ExpenseEditModalProps } from "./ExpenseEditModal.types";

export function ExpenseEditModal({
  expense,
  isSaving,
  onClose,
  onSave,
}: ExpenseEditModalProps) {
  const [amount, setAmount] = useState(String(expense.originalAmount));
  const [description, setDescription] = useState(expense.description);
  const [transactionDate, setTransactionDate] = useState(
    expense.transactionDate.slice(0, 10),
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSaving, onClose]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSave({
      amount: Number(amount),
      description: description.trim(),
      transactionDate: new Date(`${transactionDate}T12:00:00`).toISOString(),
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-forest/45 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) {
          onClose();
        }
      }}
    >
      <section
        aria-labelledby="edit-expense-title"
        aria-modal="true"
        className="safe-bottom w-full max-w-lg rounded-t-[2rem] bg-paper p-5 shadow-2xl sm:rounded-[2rem] sm:p-7"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-coral">
              Harcamayı düzenle
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-[-0.04em]" id="edit-expense-title">
              Kayıt detayları
            </h2>
          </div>
          <button
            aria-label="Pencereyi kapat"
            className="grid size-10 place-items-center rounded-2xl bg-canvas text-muted"
            disabled={isSaving}
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={19} />
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Açıklama</span>
            <input
              autoFocus
              className="h-13 w-full rounded-2xl border border-line bg-white/75 px-4 text-sm outline-none transition focus:border-forest focus:ring-4 focus:ring-lime/25"
              maxLength={500}
              onChange={(event) => setDescription(event.target.value)}
              required
              value={description}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Tutar ({expense.currency})</span>
              <input
                className="h-13 w-full rounded-2xl border border-line bg-white/75 px-4 text-sm outline-none transition focus:border-forest focus:ring-4 focus:ring-lime/25"
                inputMode="decimal"
                min="0.01"
                onChange={(event) => setAmount(event.target.value)}
                required
                step="0.01"
                type="number"
                value={amount}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Tarih</span>
              <span className="flex h-13 items-center gap-2 rounded-2xl border border-line bg-white/75 px-3 focus-within:border-forest focus-within:ring-4 focus-within:ring-lime/25">
                <CalendarDays aria-hidden="true" className="shrink-0 text-muted" size={17} />
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                  onChange={(event) => setTransactionDate(event.target.value)}
                  required
                  type="date"
                  value={transactionDate}
                />
              </span>
            </label>
          </div>

          <button
            className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-forest text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60"
            disabled={isSaving}
            type="submit"
          >
            <Save aria-hidden="true" size={18} />
            {isSaving ? "Kaydediliyor…" : "Değişiklikleri kaydet"}
          </button>
        </form>
      </section>
    </div>
  );
}
