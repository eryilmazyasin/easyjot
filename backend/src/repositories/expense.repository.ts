import { and, count, desc, eq } from "drizzle-orm";

import { db } from "../db/index.js";
import { expenses } from "../db/schema.js";
import type {
  CreateExpenseRecord,
  ExpenseListQuery,
  ExpenseListRecords,
  ExpenseRecord,
  ExpenseRepository,
  UpdateExpenseRecord,
} from "./expense.repository.types.js";

export class DrizzleExpenseRepository implements ExpenseRepository {
  public async create(input: CreateExpenseRecord): Promise<ExpenseRecord> {
    const [expense] = await db.insert(expenses).values(input).returning();

    if (!expense) {
      throw new Error("The expense could not be created.");
    }

    return expense;
  }

  public async deleteByIdForUser(id: string, userId: string): Promise<boolean> {
    const [deletedExpense] = await db
      .delete(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
      .returning({ id: expenses.id });

    return Boolean(deletedExpense);
  }

  public async findByIdForUser(id: string, userId: string): Promise<ExpenseRecord | null> {
    const [expense] = await db
      .select()
      .from(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
      .limit(1);

    return expense ?? null;
  }

  public async listByUser(query: ExpenseListQuery): Promise<ExpenseListRecords> {
    const [records, totals] = await Promise.all([
      db
        .select()
        .from(expenses)
        .where(eq(expenses.userId, query.userId))
        .orderBy(desc(expenses.transactionDate), desc(expenses.createdAt))
        .limit(query.limit)
        .offset(query.offset),
      db.select({ total: count() }).from(expenses).where(eq(expenses.userId, query.userId)),
    ]);

    return {
      records,
      total: totals[0]?.total ?? 0,
    };
  }

  public async updateByIdForUser(
    id: string,
    userId: string,
    changes: UpdateExpenseRecord,
  ): Promise<ExpenseRecord | null> {
    const [expense] = await db
      .update(expenses)
      .set(changes)
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
      .returning();

    return expense ?? null;
  }
}

export const expenseRepository = new DrizzleExpenseRepository();
