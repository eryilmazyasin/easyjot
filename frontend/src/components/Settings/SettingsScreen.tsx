"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { CircleAlert, Coins, LogOut, Save, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

import { RequireAuth } from "@/components/Auth/RequireAuth";
import { getApiErrorMessage, userApi } from "@/lib/api";
import type { CurrencyCode } from "@/lib/api.types";
import { useAuthStore } from "@/store/authStore";

export function SettingsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const logout = useAuthStore((state) => state.logout);
  const [monthlyBudget, setMonthlyBudget] = useState("");
  const [baseCurrency, setBaseCurrency] = useState<CurrencyCode>("TRY");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setMonthlyBudget(user.monthlyBudget === null ? "" : String(user.monthlyBudget));
      setBaseCurrency(user.baseCurrency);
    }
  }, [user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);
      const budget = await userApi.updateBudget({
        monthlyBudget: monthlyBudget ? Number(monthlyBudget) : null,
        baseCurrency,
      });
      updateUser({ ...user, ...budget });
      setSuccessMessage("Bütçe tercihlerin kaydedildi.");
    } catch (saveError: unknown) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      await logout();
      router.replace("/login");
    } catch (logoutError: unknown) {
      setError(getApiErrorMessage(logoutError));
      setIsLoggingOut(false);
    }
  }

  return (
    <RequireAuth>
      <div className="page-enter pb-4 pt-4">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-coral">Kişiselleştir</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.055em]">Ayarlar</h1>
        <p className="mt-2 text-sm text-muted">Bütçe hedefini ve temel para birimini yönet.</p>

        <section className="mt-6 flex items-center gap-4 rounded-[1.75rem] border border-line bg-paper p-5 card-shadow">
          <div className="grid size-12 place-items-center rounded-2xl bg-forest text-paper">
            <UserRound aria-hidden="true" size={21} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{user?.email}</p>
            <p className="mt-1 text-xs text-muted">EasyJot hesabı</p>
          </div>
        </section>

        <form className="mt-5 rounded-[1.75rem] border border-line bg-paper p-5 card-shadow sm:p-6" onSubmit={handleSubmit}>
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-lime/35 text-forest">
              <Coins aria-hidden="true" size={19} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-[-0.03em]">Bütçe tercihleri</h2>
              <p className="mt-1 text-xs leading-5 text-muted">Boş bırakırsan aylık bütçe limiti kaldırılır.</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Aylık bütçe</span>
              <div className="flex h-13 items-center rounded-2xl border border-line bg-white/75 px-4 focus-within:border-forest focus-within:ring-4 focus-within:ring-lime/25">
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/60"
                  inputMode="decimal"
                  min="0.01"
                  onChange={(event) => setMonthlyBudget(event.target.value)}
                  placeholder="Örn. 25000"
                  step="0.01"
                  type="number"
                  value={monthlyBudget}
                />
                <span className="text-xs font-bold text-muted">{baseCurrency}</span>
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Varsayılan para birimi</span>
              <select
                className="h-13 w-full rounded-2xl border border-line bg-white/75 px-4 text-sm font-semibold outline-none focus:border-forest focus:ring-4 focus:ring-lime/25"
                onChange={(event) => setBaseCurrency(event.target.value as CurrencyCode)}
                value={baseCurrency}
              >
                <option value="TRY">Türk Lirası (TRY)</option>
                <option value="USD">Amerikan Doları (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="GBP">İngiliz Sterlini (GBP)</option>
              </select>
            </label>
          </div>

          {error ? (
            <div className="mt-4 flex items-start gap-2 rounded-2xl bg-coral/10 p-3 text-sm" role="alert">
              <CircleAlert aria-hidden="true" className="mt-0.5 shrink-0 text-coral" size={16} />
              {error}
            </div>
          ) : null}

          {successMessage ? (
            <p className="mt-4 rounded-2xl bg-lime/25 p-3 text-sm font-semibold" role="status">
              {successMessage}
            </p>
          ) : null}

          <button
            className="mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-forest text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60"
            disabled={isSaving}
            type="submit"
          >
            <Save aria-hidden="true" size={18} />
            {isSaving ? "Kaydediliyor…" : "Tercihleri kaydet"}
          </button>
        </form>

        <button
          className="mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-2xl border border-coral/30 bg-coral/5 text-sm font-bold text-coral disabled:cursor-wait disabled:opacity-60"
          disabled={isLoggingOut}
          onClick={() => void handleLogout()}
          type="button"
        >
          <LogOut aria-hidden="true" size={18} />
          {isLoggingOut ? "Çıkış yapılıyor…" : "Hesaptan çıkış yap"}
        </button>
      </div>
    </RequireAuth>
  );
}
