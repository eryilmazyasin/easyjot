"use client";

import { useEffect } from "react";

import { useAuthStore } from "@/store/authStore";
import type { AuthProviderProps } from "./AuthProvider.types";

export function AuthProvider({ children }: AuthProviderProps) {
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const clearSession = useAuthStore((state) => state.clearSession);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    window.addEventListener("easyjot:unauthorized", clearSession);
    return () => window.removeEventListener("easyjot:unauthorized", clearSession);
  }, [clearSession]);

  return children;
}
