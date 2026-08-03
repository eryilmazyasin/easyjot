export interface CreateExpenseRecord {
  userId: string;
  amount: string;
  originalAmount: string;
  currency: string;
  description: string;
  transactionDate: Date;
}

export interface ExpenseRecord extends CreateExpenseRecord {
  id: string;
  createdAt: Date;
}

export interface ExpenseListQuery {
  userId: string;
  limit: number;
  offset: number;
}

export interface ExpenseListRecords {
  records: ExpenseRecord[];
  total: number;
}

export interface UpdateExpenseRecord {
  amount?: string;
  originalAmount?: string;
  description?: string;
  transactionDate?: Date;
}

export interface ExpenseRepository {
  create(input: CreateExpenseRecord): Promise<ExpenseRecord>;
  deleteByIdForUser(id: string, userId: string): Promise<boolean>;
  findByIdForUser(id: string, userId: string): Promise<ExpenseRecord | null>;
  listByUser(query: ExpenseListQuery): Promise<ExpenseListRecords>;
  updateByIdForUser(
    id: string,
    userId: string,
    changes: UpdateExpenseRecord,
  ): Promise<ExpenseRecord | null>;
}
