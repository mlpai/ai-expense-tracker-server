export interface Budget {
  id: string;
  userId: string;
  bankAccountId: string;
  month: number;
  year: number;
  amountLimit: string; // Decimal as string
  createdAt: Date;
  updatedAt: Date;
}
