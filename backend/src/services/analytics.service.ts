import type { AnalyticsRepository } from "../repositories/analytics.repository.types.js";
import type { UserRepository } from "../repositories/user.repository.types.js";
import type { CurrencyService } from "./currency.service.js";
import type {
  AnalyticsSummary,
  RecentExpenseSummary,
} from "./analytics.service.types.js";

const istanbulUtcOffsetMilliseconds = 3 * 60 * 60 * 1_000;
const recentExpenseLimit = 5;

const roundCurrency = (amount: number): number =>
  Math.round((amount + Number.EPSILON) * 100) / 100;

const getCurrentMonthPeriod = (referenceDate: Date): { start: Date; end: Date } => {
  // Turkey uses UTC+3 year-round; shifting first keeps month boundaries stable across server zones.
  const istanbulDate = new Date(referenceDate.getTime() + istanbulUtcOffsetMilliseconds);
  const year = istanbulDate.getUTCFullYear();
  const month = istanbulDate.getUTCMonth();

  return {
    start: new Date(Date.UTC(year, month, 1) - istanbulUtcOffsetMilliseconds),
    end: new Date(Date.UTC(year, month + 1, 1) - istanbulUtcOffsetMilliseconds),
  };
};

export class AnalyticsUserNotFoundError extends Error {
  public constructor() {
    super("User not found.");
    this.name = "AnalyticsUserNotFoundError";
  }
}

export class AnalyticsService {
  public constructor(
    private readonly analytics: AnalyticsRepository,
    private readonly users: UserRepository,
    private readonly currencyService: CurrencyService,
  ) {}

  public async getMonthlySummary(
    userId: string,
    referenceDate: Date = new Date(),
  ): Promise<AnalyticsSummary> {
    const user = await this.users.findById(userId);

    if (!user) {
      throw new AnalyticsUserNotFoundError();
    }

    const period = getCurrentMonthPeriod(referenceDate);
    const monthlyData = await this.analytics.getMonthlySummary({
      userId,
      periodStart: period.start,
      periodEnd: period.end,
      recentLimit: recentExpenseLimit,
    });
    const baseCurrencyRate = await this.currencyService.getRateToTry(
      user.baseCurrency,
      referenceDate,
    );
    const totalSpent = roundCurrency(Number(monthlyData.totalAmountInTry) / baseCurrencyRate);
    const monthlyBudget = user.monthlyBudget === null ? null : Number(user.monthlyBudget);
    const remainingBudget =
      monthlyBudget === null ? null : roundCurrency(monthlyBudget - totalSpent);
    const budgetUsagePercentage =
      monthlyBudget === null || monthlyBudget <= 0
        ? null
        : roundCurrency((totalSpent / monthlyBudget) * 100);
    const recentExpenses: RecentExpenseSummary[] = monthlyData.recentExpenses.map((expense) => ({
      id: expense.id,
      amountInBaseCurrency: roundCurrency(Number(expense.amount) / baseCurrencyRate),
      baseCurrency: user.baseCurrency,
      originalAmount: Number(expense.originalAmount),
      currency: expense.currency,
      description: expense.description,
      transactionDate: expense.transactionDate,
    }));

    return {
      baseCurrency: user.baseCurrency,
      totalSpent,
      monthlyBudget,
      remainingBudget,
      budgetUsagePercentage,
      recentExpenses,
    };
  }
}
