import type { Expense } from "@/lib/api.types";

export interface ExpenseEditModalProps {
  expense: Expense;
  isSaving: boolean;
  onClose(): void;
  onSave(changes: ExpenseUpdateFormValues): Promise<void>;
}

export interface ExpenseUpdateFormValues {
  amount: number;
  description: string;
  transactionDate: string;
}
