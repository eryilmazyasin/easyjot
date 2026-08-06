import type { Expense } from "@/lib/api.types";

export interface ExpenseGroup {
  dateKey: string;
  label: string;
  expenses: Expense[];
}
