import type { InternalAxiosRequestConfig } from "axios";

export type CurrencyCode = "TRY" | "USD" | "EUR" | "GBP";

export interface User {
  id: string;
  email: string;
  baseCurrency: CurrencyCode;
  monthlyBudget: number | null;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
  tokenType: "Bearer";
  user: User;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  originalAmount: number;
  currency: CurrencyCode;
  description: string;
  transactionDate: string;
  createdAt: string;
}

export interface RecentExpense {
  id: string;
  amountInBaseCurrency: number;
  baseCurrency: CurrencyCode;
  originalAmount: number;
  currency: CurrencyCode;
  description: string;
  transactionDate: string;
}

export interface AnalyticsSummary {
  baseCurrency: CurrencyCode;
  totalSpent: number;
  monthlyBudget: number | null;
  remainingBudget: number | null;
  budgetUsagePercentage: number | null;
  recentExpenses: RecentExpense[];
}

export interface ExpenseListResponse {
  data: Expense[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BudgetSettings {
  baseCurrency: CurrencyCode;
  monthlyBudget: number | null;
}

export interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}
