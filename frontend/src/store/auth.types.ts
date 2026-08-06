import type { User } from "@/lib/api.types";

export interface AuthState {
  user: User | null;
  isHydrated: boolean;
  isSubmitting: boolean;
  error: string | null;
  login(email: string, password: string): Promise<void>;
  register(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  restoreSession(): Promise<void>;
  clearSession(): void;
  updateUser(user: User): void;
}
