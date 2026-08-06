"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole, Mail, NotebookPen } from "lucide-react";

import { useAuthStore } from "@/store/authStore";

import type { AuthFormProps } from "./AuthForm.types";

const content = {
  login: {
    eyebrow: "Tekrar hoş geldin",
    title: "Hesabına giriş yap",
    description: "Harcama akışına kaldığın yerden devam et.",
    button: "Giriş yap",
    question: "Henüz hesabın yok mu?",
    linkLabel: "Kayıt ol",
    linkHref: "/register",
  },
  register: {
    eyebrow: "EasyJot'a katıl",
    title: "Sade bütçe takibine başla",
    description: "Bir cümle yaz, harcaman anında kaydolup bütçene yansısın.",
    button: "Hesap oluştur",
    question: "Zaten hesabın var mı?",
    linkLabel: "Giriş yap",
    linkHref: "/login",
  },
} as const;

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const error = useAuthStore((state) => state.error);
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const copy = content[mode];

  useEffect(() => {
    if (isHydrated && user) {
      router.replace("/");
    }
  }, [isHydrated, router, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password);
      }
      router.replace("/");
    } catch {
      // The auth store exposes a user-friendly API error for the form alert.
    }
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-5 py-10">
      <div className="pointer-events-none absolute -left-24 top-10 size-64 rounded-full bg-[var(--color-lime)]/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 bottom-8 size-72 rounded-full bg-[var(--color-coral)]/20 blur-3xl" />

      <section className="relative w-full max-w-md rounded-[2rem] border border-black/5 bg-[var(--color-paper)] p-6 shadow-[0_24px_80px_rgba(23,53,44,0.13)] sm:p-8">
        <Link className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-forest)]" href="/">
          <span className="grid size-9 place-items-center rounded-xl bg-[var(--color-forest)] text-[var(--color-paper)]">
            <NotebookPen aria-hidden="true" size={18} />
          </span>
          EasyJot
        </Link>

        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-coral)]">
          {copy.eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--color-forest)]">
          {copy.title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{copy.description}</p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--color-forest)]">E-posta</span>
            <span className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white/70 px-4 transition focus-within:border-[var(--color-forest)] focus-within:ring-4 focus-within:ring-[var(--color-lime)]/25">
              <Mail aria-hidden="true" className="text-[var(--color-muted)]" size={18} />
              <input
                autoComplete="email"
                className="h-13 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-black/35"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="sen@example.com"
                required
                type="email"
                value={email}
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--color-forest)]">Şifre</span>
            <span className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white/70 px-4 transition focus-within:border-[var(--color-forest)] focus-within:ring-4 focus-within:ring-[var(--color-lime)]/25">
              <LockKeyhole aria-hidden="true" className="text-[var(--color-muted)]" size={18} />
              <input
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="h-13 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-black/35"
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="En az 8 karakter"
                required
                type="password"
                value={password}
              />
            </span>
          </label>

          {error ? (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}

          <button
            className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-forest)] px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#214a3d] disabled:cursor-wait disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "İşleniyor…" : copy.button}
            {!isSubmitting ? <ArrowRight aria-hidden="true" size={18} /> : null}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--color-muted)]">
          {copy.question}{" "}
          <Link className="font-semibold text-[var(--color-forest)] underline-offset-4 hover:underline" href={copy.linkHref}>
            {copy.linkLabel}
          </Link>
        </p>
      </section>
    </main>
  );
}
