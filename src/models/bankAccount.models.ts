export interface BankAccount {
  id: string;
  userId: string;
  name: string;
  accountNumber: string;
  bankName: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}
