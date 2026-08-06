export interface RecentExpenseSummary {
  id: string;
  amountInBaseCurrency: number;
  baseCurrency: string;
  originalAmount: number;
  currency: string;
  description: string;
  transactionDate: Date;
}

export interface AnalyticsSummary {
  baseCurrency: string;
  totalSpent: number;
  monthlyBudget: number | null;
  remainingBudget: number | null;
  budgetUsagePercentage: number | null;
  recentExpenses: RecentExpenseSummary[];
}
