"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { authApi, getApiErrorMessage } from "@/lib/api";
import { tokenStorage } from "@/lib/tokenStorage";
import type { AuthState } from "./auth.types";

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isHydrated: false,
      isSubmitting: false,
      error: null,
      async login(email, password) {
        set({ isSubmitting: true, error: null });
        try {
          const session = await authApi.login(email, password);
          tokenStorage.setTokens(session.accessToken, session.refreshToken);
          set({ user: session.user, isSubmitting: false });
        } catch (error: unknown) {
          const message = getApiErrorMessage(error);
          set({ error: message, isSubmitting: false });
          throw error;
        }
      },
      async register(email, password) {
        set({ isSubmitting: true, error: null });
        try {
          const session = await authApi.register(email, password);
          tokenStorage.setTokens(session.accessToken, session.refreshToken);
          set({ user: session.user, isSubmitting: false });
        } catch (error: unknown) {
          const message = getApiErrorMessage(error);
          set({ error: message, isSubmitting: false });
          throw error;
        }
      },
      async logout() {
        const refreshToken = tokenStorage.getRefreshToken();
        try {
          if (refreshToken) {
            await authApi.logout(refreshToken);
          }
        } finally {
          get().clearSession();
        }
      },
      async restoreSession() {
        const refreshToken = tokenStorage.getRefreshToken();
        const accessToken = tokenStorage.getAccessToken();

        if (!refreshToken) {
          set({ user: null, isHydrated: true });
          return;
        }

        if (accessToken && get().user) {
          set({ isHydrated: true });
          return;
        }

        try {
          const session = await authApi.refresh();
          set({ user: session.user, isHydrated: true });
        } catch {
          get().clearSession();
        }
      },
      clearSession() {
        tokenStorage.clear();
        set({ user: null, isHydrated: true, error: null, isSubmitting: false });
      },
      updateUser(user) {
        set({ user });
      },
    }),
    {
      name: "easyjot.auth",
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
