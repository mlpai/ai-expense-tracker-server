export interface MonthlyReport {
  id: string;
  userId: string;
  month: number;
  year: number;
  totalExpense: string; // Decimal as string
  generatedAt: Date;
  reportData: any; // JSON type
}
