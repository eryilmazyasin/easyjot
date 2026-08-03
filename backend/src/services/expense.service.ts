import type {
  ExpenseRecord,
  ExpenseRepository,
  UpdateExpenseRecord,
} from "../repositories/expense.repository.types.js";
import type { CurrencyService } from "./currency.service.js";
import type {
  Expense,
  ExpenseListResult,
  UpdateExpenseInput,
} from "./expense.service.types.js";
import type { TextParserService } from "./textParser.service.js";

const maximumExpenseAmount = 999_999_999_999.99;

export class ExpenseNotFoundError extends Error {
  public constructor() {
    super("Expense not found.");
    this.name = "ExpenseNotFoundError";
  }
}

export class ExpenseValidationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "ExpenseValidationError";
  }
}

const toExpense = (record: ExpenseRecord): Expense => ({
  id: record.id,
  userId: record.userId,
  amount: Number(record.amount),
  originalAmount: Number(record.originalAmount),
  currency: record.currency,
  description: record.description,
  transactionDate: record.transactionDate,
  createdAt: record.createdAt,
});

export class ExpenseService {
  public constructor(
    private readonly expenses: ExpenseRepository,
    private readonly currencyService: CurrencyService,
    private readonly textParser: TextParserService,
  ) {}

  public async quickAdd(userId: string, input: string): Promise<Expense> {
    const parsedExpense = this.textParser.parse(input);
    this.assertValidAmount(parsedExpense.amount);

    const conversion = await this.currencyService.convertToTry(
      parsedExpense.amount,
      parsedExpense.currency,
    );
    const expense = await this.expenses.create({
      userId,
      amount: conversion.amountInTry.toFixed(2),
      originalAmount: conversion.originalAmount.toFixed(2),
      currency: conversion.currency,
      description: parsedExpense.description,
      transactionDate: parsedExpense.transactionDate,
    });

    return toExpense(expense);
  }

  public async list(userId: string, page: number, limit: number): Promise<ExpenseListResult> {
    const result = await this.expenses.listByUser({
      userId,
      limit,
      offset: (page - 1) * limit,
    });

    return {
      data: result.records.map(toExpense),
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }

  public async update(
    userId: string,
    expenseId: string,
    input: UpdateExpenseInput,
  ): Promise<Expense> {
    const existingExpense = await this.expenses.findByIdForUser(expenseId, userId);

    if (!existingExpense) {
      throw new ExpenseNotFoundError();
    }

    const changes: UpdateExpenseRecord = {};

    if (input.amount !== undefined) {
      this.assertValidAmount(input.amount);
      const conversion = await this.currencyService.convertToTry(
        input.amount,
        existingExpense.currency,
      );
      changes.amount = conversion.amountInTry.toFixed(2);
      changes.originalAmount = conversion.originalAmount.toFixed(2);
    }

    if (input.description !== undefined) {
      changes.description = input.description.trim();
    }

    if (input.transactionDate !== undefined) {
      changes.transactionDate = input.transactionDate;
    }

    const updatedExpense = await this.expenses.updateByIdForUser(
      expenseId,
      userId,
      changes,
    );

    if (!updatedExpense) {
      throw new ExpenseNotFoundError();
    }

    return toExpense(updatedExpense);
  }

  public async delete(userId: string, expenseId: string): Promise<void> {
    const deleted = await this.expenses.deleteByIdForUser(expenseId, userId);

    if (!deleted) {
      throw new ExpenseNotFoundError();
    }
  }

  private assertValidAmount(amount: number): void {
    if (!Number.isFinite(amount) || amount <= 0 || amount > maximumExpenseAmount) {
      throw new ExpenseValidationError("Expense amount is outside the supported range.");
    }
  }
}
