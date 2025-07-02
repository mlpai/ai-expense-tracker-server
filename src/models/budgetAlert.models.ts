export interface BudgetAlert {
  id: string;
  budgetId: string;
  alertType: string;
  message: string;
  createdAt: Date;
}
