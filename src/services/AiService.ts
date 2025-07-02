import OpenAI from "openai";
import { Decimal } from "@prisma/client/runtime/library";
import { PrismaClient } from "../../generated/prisma";

export interface SpendingAnalysis {
  totalExpense: number;
  totalIncome: number;
  netSavings: number;
  topCategories: Array<{ name: string; amount: number; percentage: number }>;
  spendingTrends: Array<{ month: string; amount: number }>;
  unusualExpenses: Array<{ description: string; amount: number; date: string }>;
}

export interface AiSuggestionData {
  userId: string;
  title: string;
  suggestion: string;
  category: "BUDGET" | "SAVINGS" | "SPENDING_PATTERN" | "INVESTMENT";
  priority: "LOW" | "MEDIUM" | "HIGH";
}

export class AiService {
  private openai: OpenAI;

  constructor(private readonly prisma: PrismaClient) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateMonthlyReport(userId: string, month: number, year: number) {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      // Get expenses for the month
      const expenses = await this.prisma.expense.findMany({
        where: {
          userId,
          date: { gte: startDate, lte: endDate },
        },
        include: {
          expenseType: {
            include: {
              category: true,
            },
          },
        },
      });

      // Get deposits for the month
      const deposits = await this.prisma.deposit.findMany({
        where: {
          userId,
          date: { gte: startDate, lte: endDate },
        },
        include: {
          depositType: true,
        },
      });

      // Get budget for the month
      const budget = await this.prisma.budget.findFirst({
        where: {
          userId,
          month,
          year,
        },
      });

      // Calculate totals
      const totalExpense = expenses.reduce(
        (sum: number, expense: any) => sum + Number(expense.amount),
        0
      );
      const totalIncome = deposits.reduce(
        (sum: number, deposit: any) => sum + Number(deposit.amount),
        0
      );
      const netSavings = totalIncome - totalExpense;

      // Analyze spending by category
      const categoryAnalysis = this.analyzeSpendingByCategory(expenses);
      const spendingTrends = await this.getSpendingTrends(userId, year);
      const unusualExpenses = this.findUnusualExpenses(expenses);

      // Generate AI insights
      const aiInsights = await this.generateAiInsights({
        totalExpense,
        totalIncome,
        netSavings,
        categoryAnalysis,
        spendingTrends,
        unusualExpenses,
        budget,
        month,
        year,
      });

      // Determine budget status
      let budgetStatus = "ON_TRACK";
      if (budget) {
        const spentPercentage =
          (totalExpense / Number(budget.amountLimit)) * 100;
        if (spentPercentage > 100) {
          budgetStatus = "OVER_BUDGET";
        } else if (spentPercentage < 80) {
          budgetStatus = "UNDER_BUDGET";
        }
      }

      // Create or update monthly report
      const reportData = {
        totalExpense,
        totalIncome,
        netSavings,
        categoryAnalysis,
        spendingTrends,
        unusualExpenses,
        budget: budget
          ? {
              limit: Number(budget.amountLimit),
              spent: Number(budget.spentAmount),
              percentage:
                (Number(budget.spentAmount) / Number(budget.amountLimit)) * 100,
            }
          : null,
      };

      const existingReport = await this.prisma.monthlyReport.findFirst({
        where: {
          userId,
          month,
          year,
        },
      });

      if (existingReport) {
        await this.prisma.monthlyReport.update({
          where: { id: existingReport.id },
          data: {
            totalExpense: new Decimal(totalExpense),
            totalIncome: new Decimal(totalIncome),
            netSavings: new Decimal(netSavings),
            budgetStatus,
            reportData: reportData as any,
            aiInsights: aiInsights as any,
          },
        });
      } else {
        await this.prisma.monthlyReport.create({
          data: {
            userId,
            month,
            year,
            totalExpense: new Decimal(totalExpense),
            totalIncome: new Decimal(totalIncome),
            netSavings: new Decimal(netSavings),
            budgetStatus,
            reportData: reportData as any,
            aiInsights: aiInsights as any,
          },
        });
      }

      return {
        totalExpense,
        totalIncome,
        netSavings,
        budgetStatus,
        categoryAnalysis,
        spendingTrends,
        unusualExpenses,
        aiInsights,
      };
    } catch (error) {
      throw new Error(`Failed to generate monthly report: ${error}`);
    }
  }

  async generateAiSuggestions(userId: string) {
    try {
      // Get recent financial data
      const last3Months = await this.getLast3MonthsData(userId);
      const currentBudget = await this.prisma.budget.findFirst({
        where: {
          userId,
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
        },
      });

      const suggestions = await this.analyzeAndGenerateSuggestions(
        last3Months,
        currentBudget
      );

      // Save suggestions to database
      const savedSuggestions = [];
      for (const suggestion of suggestions) {
        const savedSuggestion = await this.prisma.aiSuggestion.create({
          data: {
            userId,
            title: suggestion.title,
            suggestion: suggestion.suggestion,
            category: suggestion.category,
            priority: suggestion.priority,
          },
        });
        savedSuggestions.push(savedSuggestion);
      }

      return savedSuggestions;
    } catch (error) {
      throw new Error(`Failed to generate AI suggestions: ${error}`);
    }
  }

  async getAiSuggestions(userId: string, category?: string, isRead?: boolean) {
    try {
      const where: any = { userId };
      if (category) where.category = category;
      if (isRead !== undefined) where.isRead = isRead;

      const suggestions = await this.prisma.aiSuggestion.findMany({
        where,
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      });

      return suggestions;
    } catch (error) {
      throw new Error(`Failed to get AI suggestions: ${error}`);
    }
  }

  async markSuggestionAsRead(suggestionId: string) {
    try {
      const suggestion = await this.prisma.aiSuggestion.update({
        where: { id: suggestionId },
        data: { isRead: true },
      });

      return suggestion;
    } catch (error) {
      throw new Error(`Failed to mark suggestion as read: ${error}`);
    }
  }

  private analyzeSpendingByCategory(expenses: any[]) {
    const categoryMap = new Map<string, number>();

    expenses.forEach((expense: any) => {
      const categoryName = expense.expenseType.category.name;
      const amount = Number(expense.amount);
      categoryMap.set(
        categoryName,
        (categoryMap.get(categoryName) || 0) + amount
      );
    });

    const total = Array.from(categoryMap.values()).reduce(
      (sum, amount) => sum + amount,
      0
    );

    const categoryAnalysis = Array.from(categoryMap.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: (amount / total) * 100,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5); // Top 5 categories

    return categoryAnalysis;
  }

  private async getSpendingTrends(userId: string, year: number) {
    const trends = [];

    for (let month = 1; month <= 12; month++) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const expenses = await this.prisma.expense.findMany({
        where: {
          userId,
          date: { gte: startDate, lte: endDate },
        },
      });

      const total = expenses.reduce(
        (sum: number, expense: any) => sum + Number(expense.amount),
        0
      );
      trends.push({
        month: new Date(year, month - 1, 1).toLocaleDateString("en-US", {
          month: "short",
        }),
        amount: total,
      });
    }

    return trends;
  }

  private findUnusualExpenses(expenses: any[]) {
    if (expenses.length === 0) return [];

    const amounts = expenses.map((expense: any) => Number(expense.amount));
    const mean =
      amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    const variance =
      amounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) /
      amounts.length;
    const standardDeviation = Math.sqrt(variance);

    const unusualExpenses = expenses
      .filter((expense: any) => {
        const amount = Number(expense.amount);
        return amount > mean + 2 * standardDeviation; // More than 2 standard deviations above mean
      })
      .map((expense: any) => ({
        description: expense.note || expense.expenseType.name,
        amount: Number(expense.amount),
        date: expense.date.toISOString().split("T")[0],
      }))
      .slice(0, 5); // Top 5 unusual expenses

    return unusualExpenses;
  }

  private async generateAiInsights(data: any) {
    try {
      const prompt = `
        Analyze this financial data and provide insights in JSON format:
        
        Monthly Summary:
        - Total Expense: $${data.totalExpense}
        - Total Income: $${data.totalIncome}
        - Net Savings: $${data.netSavings}
        - Budget Status: ${data.budgetStatus}
        
        Top Spending Categories: ${JSON.stringify(data.categoryAnalysis)}
        Spending Trends: ${JSON.stringify(data.spendingTrends)}
        Unusual Expenses: ${JSON.stringify(data.unusualExpenses)}
        
        Provide insights in this JSON format:
        {
          "summary": "Brief summary of financial health",
          "keyInsights": ["insight1", "insight2", "insight3"],
          "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
          "riskFactors": ["risk1", "risk2"],
          "opportunities": ["opportunity1", "opportunity2"]
        }
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are a financial advisor. Analyze spending patterns and provide actionable insights.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error("No response from AI");
      }

      return JSON.parse(responseText);
    } catch (error) {
      console.error("AI insights generation failed:", error);
      return {
        summary: "Unable to generate AI insights at this time.",
        keyInsights: [],
        recommendations: [],
        riskFactors: [],
        opportunities: [],
      };
    }
  }

  private async getLast3MonthsData(userId: string) {
    const data = [];
    const now = new Date();

    for (let i = 2; i >= 0; i--) {
      const month = now.getMonth() - i;
      const year = now.getFullYear() + Math.floor(month / 12);
      const adjustedMonth = (((month % 12) + 12) % 12) + 1;

      const startDate = new Date(year, adjustedMonth - 1, 1);
      const endDate = new Date(year, adjustedMonth, 0);

      const expenses = await this.prisma.expense.findMany({
        where: {
          userId,
          date: { gte: startDate, lte: endDate },
        },
      });

      const deposits = await this.prisma.deposit.findMany({
        where: {
          userId,
          date: { gte: startDate, lte: endDate },
        },
      });

      const totalExpense = expenses.reduce(
        (sum: number, expense: any) => sum + Number(expense.amount),
        0
      );
      const totalIncome = deposits.reduce(
        (sum: number, deposit: any) => sum + Number(deposit.amount),
        0
      );

      data.push({
        month: adjustedMonth,
        year,
        totalExpense,
        totalIncome,
        netSavings: totalIncome - totalExpense,
      });
    }

    return data;
  }

  private async analyzeAndGenerateSuggestions(
    monthlyData: any[],
    currentBudget: any
  ) {
    try {
      const prompt = `
        Analyze this 3-month financial data and provide personalized suggestions:
        
        Monthly Data: ${JSON.stringify(monthlyData)}
        Current Budget: ${
          currentBudget
            ? JSON.stringify({
                limit: Number(currentBudget.amountLimit),
                spent: Number(currentBudget.spentAmount),
                percentage:
                  (Number(currentBudget.spentAmount) /
                    Number(currentBudget.amountLimit)) *
                  100,
              })
            : "No budget set"
        }
        
        Generate 3-5 suggestions in this JSON format:
        [
          {
            "title": "Suggestion title",
            "suggestion": "Detailed suggestion with actionable steps",
            "category": "BUDGET|SAVINGS|SPENDING_PATTERN|INVESTMENT",
            "priority": "LOW|MEDIUM|HIGH"
          }
        ]
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are a financial advisor providing personalized suggestions based on spending patterns.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.4,
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error("No response from AI");
      }

      return JSON.parse(responseText);
    } catch (error) {
      console.error("AI suggestions generation failed:", error);
      return [
        {
          title: "Set up a budget",
          suggestion:
            "Consider setting up a monthly budget to better track your spending and savings goals.",
          category: "BUDGET",
          priority: "MEDIUM",
        },
      ];
    }
  }
}
