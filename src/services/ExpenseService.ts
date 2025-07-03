import { Decimal } from "@prisma/client/runtime/library";
import { PrismaClient } from "../../generated/prisma";

export interface CreateExpenseData {
  userId?: string;
  bankAccountId: string;
  categoryId: string;
  amount: number;
  note?: string;
  date?: Date | string;
  isRecurring?: boolean;
  recurringExpenseId?: string;
  receiptId?: string;
}

export interface CreateRecurringExpenseData {
  userId: string;
  categoryId: string;
  amount: number;
  note?: string;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  startDate: Date;
  endDate?: Date;
}

export interface UpdateExpenseData {
  categoryId?: string;
  amount?: number;
  note?: string;
  date?: Date;
  isRecurring?: boolean;
  recurringExpenseId?: string;
}

export class ExpenseService {
  constructor(private readonly prisma: PrismaClient) {}

  async createExpense(data: CreateExpenseData) {
    try {
      // Ensure userId is provided
      if (!data.userId) {
        throw new Error("User ID is required");
      }

      // Validation: If isRecurring=true, recurringExpenseId must be present
      if (data.isRecurring && !data.recurringExpenseId) {
        throw new Error(
          "recurringExpenseId is required when isRecurring is true"
        );
      }

      // Convert date string to Date object if provided
      const expenseDate = data.date
        ? typeof data.date === "string"
          ? new Date(data.date)
          : data.date
        : new Date();

      const expense = await this.prisma.expense.create({
        data: {
          userId: data.userId,
          bankAccountId: data.bankAccountId,
          categoryId: data.categoryId,
          amount: new Decimal(data.amount),
          note: data.note,
          date: expenseDate,
          isRecurring: data.isRecurring || false,
          recurringExpenseId: data.recurringExpenseId,
          receiptId: data.receiptId,
        },
        include: {
          category: true,
          bankAccount: true,
          receipt: true,
          recurringExpense: true, // Include the recurring expense data
        },
      });

      // Update bank account balance
      await this.updateBankAccountBalance(data.bankAccountId, -data.amount);

      return expense;
    } catch (error) {
      throw new Error(`Failed to create expense: ${error}`);
    }
  }

  async getExpensesByUserId(
    userId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      bankAccountId?: string;
      categoryId?: string;
    }
  ) {
    try {
      const where: any = { userId };

      if (filters?.startDate || filters?.endDate) {
        where.date = {};
        if (filters.startDate) where.date.gte = filters.startDate;
        if (filters.endDate) where.date.lte = filters.endDate;
      }

      if (filters?.bankAccountId) where.bankAccountId = filters.bankAccountId;
      if (filters?.categoryId) where.categoryId = filters.categoryId;

      const expenses = await this.prisma.expense.findMany({
        where,
        include: {
          category: true,
          bankAccount: true,
          receipt: true,
          recurringExpense: true, // Include the recurring expense data
        },
        orderBy: { date: "desc" },
      });

      return expenses;
    } catch (error) {
      throw new Error(`Failed to get expenses: ${error}`);
    }
  }

  async getExpenseById(id: string) {
    try {
      const expense = await this.prisma.expense.findUnique({
        where: { id },
        include: {
          category: true,
          bankAccount: true,
          receipt: true,
          recurringExpense: true, // Include the recurring expense data
        },
      });

      return expense;
    } catch (error) {
      throw new Error(`Failed to get expense: ${error}`);
    }
  }

  async updateExpense(id: string, data: UpdateExpenseData) {
    try {
      const oldExpense = await this.prisma.expense.findUnique({
        where: { id },
        select: {
          amount: true,
          bankAccountId: true,
          isRecurring: true,
          recurringExpenseId: true,
        },
      });

      if (!oldExpense) {
        throw new Error("Expense not found");
      }

      // Validation: If isRecurring=true, recurringExpenseId must be present
      if (data.isRecurring && !data.recurringExpenseId) {
        throw new Error(
          "recurringExpenseId is required when isRecurring is true"
        );
      }

      const updateData: any = {};
      if (data.categoryId) updateData.categoryId = data.categoryId;
      if (data.amount !== undefined)
        updateData.amount = new Decimal(data.amount);
      if (data.note !== undefined) updateData.note = data.note;
      if (data.date) updateData.date = data.date;
      if (data.isRecurring !== undefined)
        updateData.isRecurring = data.isRecurring;
      if (data.recurringExpenseId !== undefined)
        updateData.recurringExpenseId = data.recurringExpenseId;

      const expense = await this.prisma.expense.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
          bankAccount: true,
          receipt: true,
          recurringExpense: true, // Include the recurring expense data
        },
      });

      // Update bank account balance if amount changed
      if (data.amount !== undefined) {
        const balanceChange = data.amount - Number(oldExpense.amount);
        await this.updateBankAccountBalance(
          oldExpense.bankAccountId,
          -balanceChange
        );
      }

      return expense;
    } catch (error) {
      throw new Error(`Failed to update expense: ${error}`);
    }
  }

  async deleteExpense(id: string) {
    try {
      const expense = await this.prisma.expense.findUnique({
        where: { id },
        select: { amount: true, bankAccountId: true },
      });

      if (!expense) {
        throw new Error("Expense not found");
      }

      await this.prisma.expense.delete({ where: { id } });

      // Restore bank account balance
      await this.updateBankAccountBalance(
        expense.bankAccountId,
        Number(expense.amount)
      );

      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete expense: ${error}`);
    }
  }

  async createRecurringExpense(data: CreateRecurringExpenseData) {
    try {
      const nextDueDate = this.calculateNextDueDate(
        data.startDate,
        data.frequency
      );

      const recurringExpense = await this.prisma.recurringExpense.create({
        data: {
          userId: data.userId,
          categoryId: data.categoryId,
          amount: new Decimal(data.amount),
          note: data.note,
          frequency: data.frequency,
          startDate: data.startDate,
          endDate: data.endDate,
          nextDueDate,
        },
        include: {
          category: true,
        },
      });

      return recurringExpense;
    } catch (error) {
      throw new Error(`Failed to create recurring expense: ${error}`);
    }
  }

  async getRecurringExpensesByUserId(userId: string) {
    try {
      const recurringExpenses = await this.prisma.recurringExpense.findMany({
        where: { userId, isActive: true },
        include: {
          category: true,
        },
        orderBy: { nextDueDate: "asc" },
      });

      return recurringExpenses;
    } catch (error) {
      throw new Error(`Failed to get recurring expenses: ${error}`);
    }
  }

  async processRecurringExpenses() {
    try {
      const today = new Date();
      const dueExpenses = await this.prisma.recurringExpense.findMany({
        where: {
          isActive: true,
          nextDueDate: { lte: today },
          OR: [{ endDate: null }, { endDate: { gte: today } }],
        },
        include: {
          category: true,
        },
      });

      const processedExpenses = [];

      for (const recurringExpense of dueExpenses) {
        // Get user's default bank account
        const defaultAccount = await this.prisma.bankAccount.findFirst({
          where: {
            userId: recurringExpense.userId,
            isDefault: true,
          },
        });

        if (!defaultAccount) {
          console.log(
            `No default account found for user ${recurringExpense.userId}`
          );
          continue;
        }

        // Create the expense
        const expense = await this.createExpense({
          userId: recurringExpense.userId,
          bankAccountId: defaultAccount.id,
          categoryId: recurringExpense.categoryId,
          amount: Number(recurringExpense.amount),
          note: recurringExpense.note ?? undefined,
          date: new Date(),
          isRecurring: true,
          recurringExpenseId: recurringExpense.id,
        });

        // Update next due date
        const nextDueDate = this.calculateNextDueDate(
          recurringExpense.nextDueDate,
          recurringExpense.frequency
        );

        await this.prisma.recurringExpense.update({
          where: { id: recurringExpense.id },
          data: { nextDueDate },
        });

        processedExpenses.push(expense);
      }

      return processedExpenses;
    } catch (error) {
      throw new Error(`Failed to process recurring expenses: ${error}`);
    }
  }

  async getExpenseSummary(userId: string, startDate: Date, endDate: Date) {
    try {
      const expenses = await this.prisma.expense.findMany({
        where: {
          userId,
          date: { gte: startDate, lte: endDate },
        },
        include: {
          category: true,
        },
      });

      const summary = {
        totalAmount: 0,
        count: expenses.length,
        byCategory: {} as Record<string, { amount: number; count: number }>,
        byType: {} as Record<string, { amount: number; count: number }>,
      };

      expenses.forEach((expense: any) => {
        const amount = Number(expense.amount);
        summary.totalAmount += amount;

        // By category
        const categoryName = expense.category.name;
        if (!summary.byCategory[categoryName]) {
          summary.byCategory[categoryName] = { amount: 0, count: 0 };
        }
        summary.byCategory[categoryName].amount += amount;
        summary.byCategory[categoryName].count += 1;

        // By type
        const typeName = expense.category.name;
        if (!summary.byType[typeName]) {
          summary.byType[typeName] = { amount: 0, count: 0 };
        }
        summary.byType[typeName].amount += amount;
        summary.byType[typeName].count += 1;
      });

      return summary;
    } catch (error) {
      throw new Error(`Failed to get expense summary: ${error}`);
    }
  }

  private async updateBankAccountBalance(
    bankAccountId: string,
    amountChange: number
  ) {
    try {
      await this.prisma.bankAccount.update({
        where: { id: bankAccountId },
        data: {
          balance: {
            increment: amountChange,
          },
        },
      });
    } catch (error) {
      throw new Error(`Failed to update bank account balance: ${error}`);
    }
  }

  private calculateNextDueDate(currentDate: Date, frequency: string): Date {
    const nextDate = new Date(currentDate);

    switch (frequency) {
      case "DAILY":
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case "WEEKLY":
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case "MONTHLY":
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case "YEARLY":
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        throw new Error(`Invalid frequency: ${frequency}`);
    }

    return nextDate;
  }
}
