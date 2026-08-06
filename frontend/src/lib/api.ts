import axios, { AxiosError } from "axios";

import type {
  AnalyticsSummary,
  AuthResponse,
  BudgetSettings,
  CurrencyCode,
  Expense,
  ExpenseListResponse,
  RetryableRequestConfig,
} from "./api.types";
import { tokenStorage } from "./tokenStorage";

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/u, "") ?? "/api";
const apiBaseUrl = configuredApiUrl.endsWith("/v1")
  ? configuredApiUrl
  : `${configuredApiUrl}/v1`;

export const api = axios.create({
  baseURL: apiBaseUrl,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

let refreshPromise: Promise<AuthResponse> | null = null;

const refreshSession = async (): Promise<AuthResponse> => {
  const refreshToken = tokenStorage.getRefreshToken();

  if (!refreshToken) {
    throw new Error("Refresh token is unavailable.");
  }

  const response = await axios.post<AuthResponse>(`${apiBaseUrl}/auth/refresh`, {
    refreshToken,
  });
  tokenStorage.setTokens(response.data.accessToken, response.data.refreshToken);

  return response.data;
};

api.interceptors.request.use((config) => {
  const accessToken = tokenStorage.getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as RetryableRequestConfig | undefined;
    const isSessionRequest = ["/auth/login", "/auth/register", "/auth/refresh"].some(
      (path) => request?.url?.includes(path),
    );

    if (error.response?.status !== 401 || !request || request._retry || isSessionRequest) {
      return Promise.reject(error);
    }

    request._retry = true;
    refreshPromise ??= refreshSession().finally(() => {
      refreshPromise = null;
    });

    try {
      const session = await refreshPromise;
      request.headers.Authorization = `Bearer ${session.accessToken}`;
      return api(request);
    } catch (refreshError: unknown) {
      tokenStorage.clear();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("easyjot:unauthorized"));
      }
      return Promise.reject(refreshError);
    }
  },
);

export const authApi = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/login", { email, password });
    return response.data;
  },
  async register(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/register", { email, password });
    return response.data;
  },
  async refresh(): Promise<AuthResponse> {
    return refreshSession();
  },
  async logout(refreshToken: string): Promise<void> {
    await api.post("/auth/logout", { refreshToken });
  },
};

export const analyticsApi = {
  async getSummary(): Promise<AnalyticsSummary> {
    const response = await api.get<AnalyticsSummary>("/analytics/summary");
    return response.data;
  },
};

export const expenseApi = {
  async quickAdd(input: string): Promise<Expense> {
    const response = await api.post<{ expense: Expense }>("/expenses/quick-add", { input });
    return response.data.expense;
  },
  async list(page = 1, limit = 100): Promise<ExpenseListResponse> {
    const response = await api.get<ExpenseListResponse>("/expenses", {
      params: { page, limit },
    });
    return response.data;
  },
  async update(
    id: string,
    changes: { amount?: number; description?: string; transactionDate?: string },
  ): Promise<Expense> {
    const response = await api.put<{ expense: Expense }>(`/expenses/${id}`, changes);
    return response.data.expense;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`/expenses/${id}`);
  },
};

export const userApi = {
  async updateBudget(input: {
    monthlyBudget?: number | null;
    baseCurrency?: CurrencyCode;
  }): Promise<BudgetSettings> {
    const response = await api.put<{ budget: BudgetSettings }>("/user/budget", input);
    return response.data.budget;
  },
};

export const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError<{ error?: string }>(error)) {
    return error.response?.data.error ?? "İstek tamamlanamadı. Lütfen tekrar dene.";
  }

  return "Beklenmeyen bir hata oluştu.";
};
