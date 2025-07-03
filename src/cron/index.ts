import cron from "node-cron";
import { prisma } from "../utils/prisma";
import { ExpenseService } from "../services/ExpenseService";
import { AiService } from "../services/AiService";
import { BudgetService } from "../services/BudgetService";

class CronJobs {
  private expenseService: ExpenseService;
  private aiService: AiService;
  private budgetService: BudgetService;

  constructor() {
    this.expenseService = new ExpenseService(prisma);
    this.aiService = new AiService();
    this.budgetService = new BudgetService(prisma);
  }

  // Process recurring expenses daily at 6 AM
  processRecurringExpenses() {
    cron.schedule("0 6 * * *", async () => {
      try {
        console.log("Processing recurring expenses...");
        const processedExpenses =
          await this.expenseService.processRecurringExpenses();
        console.log(`Processed ${processedExpenses.length} recurring expenses`);
      } catch (error) {
        console.error("Error processing recurring expenses:", error);
      }
    });
  }

  // Generate monthly reports on the 1st of each month at 8 AM
  generateMonthlyReports() {
    cron.schedule("0 8 1 * *", async () => {
      try {
        console.log("Generating monthly reports...");
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        // Get all users
        const users = await prisma.user.findMany();

        for (const user of users) {
          try {
            await this.aiService.generateMonthlyReport(
              user.id,
              lastMonth.getMonth() + 1,
              lastMonth.getFullYear()
            );
            console.log(`Generated report for user ${user.id}`);
          } catch (error) {
            console.error(
              `Error generating report for user ${user.id}:`,
              error
            );
          }
        }
      } catch (error) {
        console.error("Error generating monthly reports:", error);
      }
    });
  }

  // Generate AI suggestions weekly on Sundays at 9 AM
  generateAiSuggestions() {
    cron.schedule("0 9 * * 0", async () => {
      try {
        console.log("Generating AI suggestions...");
        const users = await prisma.user.findMany();

        for (const user of users) {
          try {
            await this.aiService.generateAiSuggestions(user.id);
            console.log(`Generated suggestions for user ${user.id}`);
          } catch (error) {
            console.error(
              `Error generating suggestions for user ${user.id}:`,
              error
            );
          }
        }
      } catch (error) {
        console.error("Error generating AI suggestions:", error);
      }
    });
  }

  // Check budget thresholds daily at 7 AM
  checkBudgetThresholds() {
    cron.schedule("0 7 * * *", async () => {
      try {
        console.log("Checking budget thresholds...");
        const budgets = await prisma.budget.findMany({
          include: {
            user: true,
          },
        });

        for (const budget of budgets) {
          try {
            // Recalculate spending for current month
            await this.budgetService.recalculateBudgetSpending(budget.id);
            console.log(
              `Checked budget ${budget.id} for user ${budget.userId}`
            );
          } catch (error) {
            console.error(`Error checking budget ${budget.id}:`, error);
          }
        }
      } catch (error) {
        console.error("Error checking budget thresholds:", error);
      }
    });
  }

  // Clean up old notifications monthly on the 15th at 10 AM
  cleanupOldNotifications() {
    cron.schedule("0 10 15 * *", async () => {
      try {
        console.log("Cleaning up old notifications...");
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const deletedCount = await prisma.notification.deleteMany({
          where: {
            createdAt: {
              lt: thirtyDaysAgo,
            },
            isRead: true,
          },
        });

        console.log(`Deleted ${deletedCount.count} old notifications`);
      } catch (error) {
        console.error("Error cleaning up notifications:", error);
      }
    });
  }

  // TEMPORARY: Expose public async methods to run each cron job manually
  async runProcessRecurringExpenses() {
    try {
      const processedExpenses =
        await this.expenseService.processRecurringExpenses();
      return { success: true, processedExpenses };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async runGenerateMonthlyReports() {
    try {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const users = await prisma.user.findMany();
      const results = [];
      for (const user of users) {
        try {
          await this.aiService.generateMonthlyReport(
            user.id,
            lastMonth.getMonth() + 1,
            lastMonth.getFullYear()
          );
          results.push({ userId: user.id, success: true });
        } catch (error) {
          results.push({
            userId: user.id,
            success: false,
            error: (error as Error).message,
          });
        }
      }
      return { success: true, results };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async runGenerateAiSuggestions() {
    try {
      const users = await prisma.user.findMany();
      const results = [];
      for (const user of users) {
        try {
          await this.aiService.generateAiSuggestions(user.id);
          results.push({ userId: user.id, success: true });
        } catch (error) {
          results.push({
            userId: user.id,
            success: false,
            error: (error as Error).message,
          });
        }
      }
      return { success: true, results };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async runCheckBudgetThresholds() {
    try {
      const budgets = await prisma.budget.findMany({ include: { user: true } });
      const results = [];
      for (const budget of budgets) {
        try {
          await this.budgetService.recalculateBudgetSpending(budget.id);
          results.push({
            budgetId: budget.id,
            userId: budget.userId,
            success: true,
          });
        } catch (error) {
          results.push({
            budgetId: budget.id,
            userId: budget.userId,
            success: false,
            error: (error as Error).message,
          });
        }
      }
      return { success: true, results };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async runCleanupOldNotifications() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const deletedCount = await prisma.notification.deleteMany({
        where: {
          createdAt: { lt: thirtyDaysAgo },
          isRead: true,
        },
      });
      return { success: true, deleted: deletedCount.count };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async runAllCrons() {
    return {
      processRecurring: await this.runProcessRecurringExpenses(),
      monthlyReports: await this.runGenerateMonthlyReports(),
      aiSuggestions: await this.runGenerateAiSuggestions(),
      budgetThresholds: await this.runCheckBudgetThresholds(),
      cleanupNotifications: await this.runCleanupOldNotifications(),
    };
  }

  // Start all cron jobs
  start() {
    console.log("Starting cron jobs...");

    this.processRecurringExpenses();
    this.generateMonthlyReports();
    this.generateAiSuggestions();
    this.checkBudgetThresholds();
    this.cleanupOldNotifications();

    console.log("All cron jobs started successfully");
  }
}

// Start cron jobs if this file is run directly
if (require.main === module) {
  const cronJobs = new CronJobs();
  cronJobs.start();
}

export default CronJobs;
