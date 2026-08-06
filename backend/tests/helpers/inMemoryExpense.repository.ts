import { randomUUID } from "node:crypto";

import type {
  CreateExpenseRecord,
  ExpenseListQuery,
  ExpenseListRecords,
  ExpenseRecord,
  ExpenseRepository,
  UpdateExpenseRecord,
} from "../../src/repositories/expense.repository.types.js";

export class InMemoryExpenseRepository implements ExpenseRepository {
  private readonly expenses = new Map<string, ExpenseRecord>();

  public async create(input: CreateExpenseRecord): Promise<ExpenseRecord> {
    const expense: ExpenseRecord = {
      ...input,
      id: randomUUID(),
      createdAt: new Date(),
    };

    this.expenses.set(expense.id, expense);
    return expense;
  }

  public async deleteByIdForUser(id: string, userId: string): Promise<boolean> {
    const expense = await this.findByIdForUser(id, userId);
    return expense ? this.expenses.delete(id) : false;
  }

  public async findByIdForUser(id: string, userId: string): Promise<ExpenseRecord | null> {
    const expense = this.expenses.get(id);
    return expense?.userId === userId ? expense : null;
  }

  public async listByUser(query: ExpenseListQuery): Promise<ExpenseListRecords> {
    const userExpenses = [...this.expenses.values()]
      .filter((expense) => expense.userId === query.userId)
      .sort((first, second) => {
        const transactionDateDifference =
          second.transactionDate.getTime() - first.transactionDate.getTime();
        return transactionDateDifference || second.createdAt.getTime() - first.createdAt.getTime();
      });

    return {
      records: userExpenses.slice(query.offset, query.offset + query.limit),
      total: userExpenses.length,
    };
  }

  public async updateByIdForUser(
    id: string,
    userId: string,
    changes: UpdateExpenseRecord,
  ): Promise<ExpenseRecord | null> {
    const expense = await this.findByIdForUser(id, userId);

    if (!expense) {
      return null;
    }

    const updatedExpense: ExpenseRecord = {
      ...expense,
      ...changes,
    };
    this.expenses.set(id, updatedExpense);

    return updatedExpense;
  }

  public getAllRecords(): ExpenseRecord[] {
    return [...this.expenses.values()];
  }
}
