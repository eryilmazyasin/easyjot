export interface UpdateBudgetSettingsInput {
  baseCurrency?: "TRY" | "USD" | "EUR" | "GBP";
  monthlyBudget?: number | null;
}

export interface UserBudgetSettings {
  baseCurrency: string;
  monthlyBudget: number | null;
}
