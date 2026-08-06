import type { ExpenseRecord } from "./expense.repository.types.js";

export interface MonthlyAnalyticsQuery {
  userId: string;
  periodStart: Date;
  periodEnd: Date;
  recentLimit: number;
}

export interface MonthlyAnalyticsRecord {
  recentExpenses: ExpenseRecord[];
  totalAmountInTry: string;
}

export interface AnalyticsRepository {
  getMonthlySummary(query: MonthlyAnalyticsQuery): Promise<MonthlyAnalyticsRecord>;
}
