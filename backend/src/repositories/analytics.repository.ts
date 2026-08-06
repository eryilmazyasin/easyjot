import { and, desc, eq, gte, lt, sum } from "drizzle-orm";

import { db } from "../db/index.js";
import { expenses } from "../db/schema.js";
import type {
  AnalyticsRepository,
  MonthlyAnalyticsQuery,
  MonthlyAnalyticsRecord,
} from "./analytics.repository.types.js";

export class DrizzleAnalyticsRepository implements AnalyticsRepository {
  public async getMonthlySummary(
    query: MonthlyAnalyticsQuery,
  ): Promise<MonthlyAnalyticsRecord> {
    const periodFilter = and(
      eq(expenses.userId, query.userId),
      gte(expenses.transactionDate, query.periodStart),
      lt(expenses.transactionDate, query.periodEnd),
    );
    const [totals, recentExpenses] = await Promise.all([
      db.select({ total: sum(expenses.amount) }).from(expenses).where(periodFilter),
      db
        .select()
        .from(expenses)
        .where(periodFilter)
        .orderBy(desc(expenses.createdAt))
        .limit(query.recentLimit),
    ]);

    return {
      recentExpenses,
      totalAmountInTry: totals[0]?.total ?? "0",
    };
  }
}

export const analyticsRepository = new DrizzleAnalyticsRepository();
