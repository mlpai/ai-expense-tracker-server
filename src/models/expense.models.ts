export interface Expense {
  id: string;
  userId: string;
  bankAccountId: string;
  expenseTypeId: string;
  amount: string; // Decimal as string
  note?: string;
  date: Date;
  createdAt: Date;
}
