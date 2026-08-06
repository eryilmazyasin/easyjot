"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuthStore } from "@/store/authStore";
import type { RequireAuthProps } from "./RequireAuth.types";

export function RequireAuth({ children }: RequireAuthProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  useEffect(() => {
    if (isHydrated && !user) {
      router.replace("/login");
    }
  }, [isHydrated, router, user]);

  if (!isHydrated || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" aria-live="polite">
        <LoaderCircle className="size-6 animate-spin text-forest" aria-hidden="true" />
        <span className="sr-only">Oturum hazırlanıyor</span>
      </div>
    );
  }

  return children;
}
