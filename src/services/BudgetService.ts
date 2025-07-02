import { Decimal } from "@prisma/client/runtime/library";
import { PrismaClient } from "../../generated/prisma";

export interface CreateBudgetData {
  userId: string;
  month: number;
  year: number;
  amountLimit: number;
  thresholdPercentage?: number;
}

export interface UpdateBudgetData {
  amountLimit?: number;
  thresholdPercentage?: number;
}

export class BudgetService {
  constructor(private readonly prisma: PrismaClient) {}

  async createBudget(data: CreateBudgetData) {
    try {
      // Check if budget already exists for this month/year
      const existingBudget = await this.prisma.budget.findFirst({
        where: {
          userId: data.userId,
          month: data.month,
          year: data.year,
        },
      });

      if (existingBudget) {
        throw new Error("Budget already exists for this month");
      }

      const budget = await this.prisma.budget.create({
        data: {
          userId: data.userId,
          month: data.month,
          year: data.year,
          amountLimit: new Decimal(data.amountLimit),
          thresholdPercentage: data.thresholdPercentage || 80,
          spentAmount: new Decimal(0),
        },
      });

      return budget;
    } catch (error) {
      throw new Error(`Failed to create budget: ${error}`);
    }
  }

  async getBudgetsByUserId(userId: string, year?: number) {
    try {
      const where: any = { userId };
      if (year) where.year = year;

      const budgets = await this.prisma.budget.findMany({
        where,
        include: {
          alerts: {
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: [{ year: "desc" }, { month: "desc" }],
      });

      return budgets;
    } catch (error) {
      throw new Error(`Failed to get budgets: ${error}`);
    }
  }

  async getBudgetById(id: string) {
    try {
      const budget = await this.prisma.budget.findUnique({
        where: { id },
        include: {
          alerts: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      return budget;
    } catch (error) {
      throw new Error(`Failed to get budget: ${error}`);
    }
  }

  async getCurrentBudget(userId: string) {
    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11
      const currentYear = now.getFullYear();

      const budget = await this.prisma.budget.findFirst({
        where: {
          userId,
          month: currentMonth,
          year: currentYear,
        },
        include: {
          alerts: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      return budget;
    } catch (error) {
      throw new Error(`Failed to get current budget: ${error}`);
    }
  }

  async updateBudget(id: string, data: UpdateBudgetData) {
    try {
      const updateData: any = {};
      if (data.amountLimit !== undefined) {
        updateData.amountLimit = new Decimal(data.amountLimit);
      }
      if (data.thresholdPercentage !== undefined) {
        updateData.thresholdPercentage = data.thresholdPercentage;
      }

      const budget = await this.prisma.budget.update({
        where: { id },
        data: updateData,
        include: {
          alerts: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      return budget;
    } catch (error) {
      throw new Error(`Failed to update budget: ${error}`);
    }
  }

  async deleteBudget(id: string) {
    try {
      // Delete associated alerts first
      await this.prisma.budgetAlert.deleteMany({
        where: { budgetId: id },
      });

      // Delete the budget
      await this.prisma.budget.delete({ where: { id } });

      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete budget: ${error}`);
    }
  }

  async updateBudgetSpending(budgetId: string, amount: number) {
    try {
      const budget = await this.prisma.budget.findUnique({
        where: { id: budgetId },
      });

      if (!budget) {
        throw new Error("Budget not found");
      }

      const newSpentAmount = Number(budget.spentAmount) + amount;
      const spentPercentage =
        (newSpentAmount / Number(budget.amountLimit)) * 100;

      // Update spent amount
      await this.prisma.budget.update({
        where: { id: budgetId },
        data: {
          spentAmount: new Decimal(newSpentAmount),
        },
      });

      // Check for alerts
      await this.checkAndCreateAlerts(
        budgetId,
        spentPercentage,
        newSpentAmount,
        Number(budget.amountLimit)
      );

      return { success: true };
    } catch (error) {
      throw new Error(`Failed to update budget spending: ${error}`);
    }
  }

  private async checkAndCreateAlerts(
    budgetId: string,
    spentPercentage: number,
    spentAmount: number,
    limitAmount: number
  ) {
    try {
      const budget = await this.prisma.budget.findUnique({
        where: { id: budgetId },
        include: { alerts: true },
      });

      if (!budget) return;

      const thresholdAmount = (limitAmount * budget.thresholdPercentage) / 100;

      // Check if threshold reached (and no alert exists for this)
      if (spentAmount >= thresholdAmount && spentAmount < limitAmount) {
        const thresholdAlertExists = budget.alerts.some(
          (alert: any) =>
            alert.alertType === "THRESHOLD_REACHED" && !alert.isRead
        );

        if (!thresholdAlertExists) {
          await this.prisma.budgetAlert.create({
            data: {
              budgetId,
              alertType: "THRESHOLD_REACHED",
              message: `You've reached ${
                budget.thresholdPercentage
              }% of your budget limit. You've spent $${spentAmount.toFixed(
                2
              )} out of $${limitAmount.toFixed(2)}.`,
            },
          });
        }
      }

      // Check if budget exceeded
      if (spentAmount >= limitAmount) {
        const exceededAlertExists = budget.alerts.some(
          (alert: any) => alert.alertType === "EXCEEDED" && !alert.isRead
        );

        if (!exceededAlertExists) {
          await this.prisma.budgetAlert.create({
            data: {
              budgetId,
              alertType: "EXCEEDED",
              message: `You've exceeded your budget limit! You've spent $${spentAmount.toFixed(
                2
              )} out of $${limitAmount.toFixed(2)}.`,
            },
          });
        }
      }
    } catch (error) {
      console.error("Error checking budget alerts:", error);
    }
  }

  async getBudgetAlerts(userId: string, isRead?: boolean) {
    try {
      const where: any = {
        budget: { userId },
      };
      if (isRead !== undefined) where.isRead = isRead;

      const alerts = await this.prisma.budgetAlert.findMany({
        where,
        include: {
          budget: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return alerts;
    } catch (error) {
      throw new Error(`Failed to get budget alerts: ${error}`);
    }
  }

  async markAlertAsRead(alertId: string) {
    try {
      const alert = await this.prisma.budgetAlert.update({
        where: { id: alertId },
        data: { isRead: true },
      });

      return alert;
    } catch (error) {
      throw new Error(`Failed to mark alert as read: ${error}`);
    }
  }

  async getBudgetSummary(userId: string, year: number) {
    try {
      const budgets = await this.prisma.budget.findMany({
        where: {
          userId,
          year,
        },
        orderBy: { month: "asc" },
      });

      const summary = {
        totalBudget: 0,
        totalSpent: 0,
        totalRemaining: 0,
        averageSpentPercentage: 0,
        months: [] as any[],
      };

      budgets.forEach((budget: any) => {
        const limit = Number(budget.amountLimit);
        const spent = Number(budget.spentAmount);
        const remaining = limit - spent;
        const percentage = (spent / limit) * 100;

        summary.totalBudget += limit;
        summary.totalSpent += spent;
        summary.totalRemaining += remaining;

        summary.months.push({
          month: budget.month,
          limit,
          spent,
          remaining,
          percentage,
        });
      });

      if (budgets.length > 0) {
        summary.averageSpentPercentage =
          (summary.totalSpent / summary.totalBudget) * 100;
      }

      return summary;
    } catch (error) {
      throw new Error(`Failed to get budget summary: ${error}`);
    }
  }

  async recalculateBudgetSpending(budgetId: string) {
    try {
      const budget = await this.prisma.budget.findUnique({
        where: { id: budgetId },
      });

      if (!budget) {
        throw new Error("Budget not found");
      }

      // Get all expenses for this user in the budget month/year
      const expenses = await this.prisma.expense.findMany({
        where: {
          userId: budget.userId,
          date: {
            gte: new Date(budget.year, budget.month - 1, 1),
            lt: new Date(budget.year, budget.month, 1),
          },
        },
      });

      const totalSpent = expenses.reduce((sum: number, expense: any) => {
        return sum + Number(expense.amount);
      }, 0);

      // Update budget with recalculated spending
      await this.prisma.budget.update({
        where: { id: budgetId },
        data: {
          spentAmount: new Decimal(totalSpent),
        },
      });

      // Check for alerts
      const spentPercentage = (totalSpent / Number(budget.amountLimit)) * 100;
      await this.checkAndCreateAlerts(
        budgetId,
        spentPercentage,
        totalSpent,
        Number(budget.amountLimit)
      );

      return { success: true, totalSpent };
    } catch (error) {
      throw new Error(`Failed to recalculate budget spending: ${error}`);
    }
  }
}
