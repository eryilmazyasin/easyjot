export interface Expense {
  id: string;
  userId: string;
  amount: number;
  originalAmount: number;
  currency: string;
  description: string;
  transactionDate: Date;
  createdAt: Date;
}

export interface ExpenseListResult {
  data: Expense[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UpdateExpenseInput {
  amount?: number;
  description?: string;
  transactionDate?: Date;
}
