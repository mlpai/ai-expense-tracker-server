import { AiSuggestion } from "./aiSuggestion.models";
import { BankAccount } from "./bankAccount.models";
import { Budget } from "./budget.models";
import { Expense } from "./expense.models";
import { MonthlyReport } from "./monthlyReport.models";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  bankAccounts?: BankAccount[];
  expenses?: Expense[];
  budgets?: Budget[];
  aiSuggestions?: AiSuggestion[];
  monthlyReports?: MonthlyReport[];
}
