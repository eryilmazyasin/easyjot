import type {
  AnalyticsRepository,
  MonthlyAnalyticsQuery,
  MonthlyAnalyticsRecord,
} from "../../src/repositories/analytics.repository.types.js";
import type { InMemoryExpenseRepository } from "./inMemoryExpense.repository.js";

export class InMemoryAnalyticsRepository implements AnalyticsRepository {
  public constructor(private readonly expenses: InMemoryExpenseRepository) {}

  public async getMonthlySummary(
    query: MonthlyAnalyticsQuery,
  ): Promise<MonthlyAnalyticsRecord> {
    const monthlyExpenses = this.expenses
      .getAllRecords()
      .filter(
        (expense) =>
          expense.userId === query.userId &&
          expense.transactionDate >= query.periodStart &&
          expense.transactionDate < query.periodEnd,
      );
    const recentExpenses = [...monthlyExpenses]
      .sort((first, second) => second.createdAt.getTime() - first.createdAt.getTime())
      .slice(0, query.recentLimit);
    const totalAmountInTry = monthlyExpenses.reduce(
      (total, expense) => total + Number(expense.amount),
      0,
    );

    return {
      recentExpenses,
      totalAmountInTry: totalAmountInTry.toFixed(2),
    };
  }
}
