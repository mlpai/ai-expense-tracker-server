import axios from "axios";
import { prisma } from "../utils/prisma";
import { PdfServiceNew, MonthlyReportData } from "./PdfServiceNew";

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

const GEMINI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export class AiService {
  private pdfService: PdfServiceNew;

  constructor() {
    this.pdfService = new PdfServiceNew();
  }

  private async callGemini(prompt: string, temperature = 0.3) {
    const body = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: { temperature },
    };
    const response = await axios.post(GEMINI_API_URL, body);
    const candidates = response.data.candidates;
    if (!candidates || !candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error("No response from Gemini");
    }
    return candidates[0].content.parts[0].text;
  }

  async generateMonthlyReport(
    userId: string,
    month: number,
    year: number,
    generatePdf: boolean = true,
    language: string = "en"
  ) {
    try {
      // Check if report already exists for this month/year
      const existingReport = await prisma.monthlyReport.findFirst({
        where: {
          userId,
          month,
          year,
        },
      });

      // Always recalculate fresh data
      const reportData = await this.calculateMonthlyData(
        userId,
        month,
        year,
        language
      );

      // If an old report exists for the same month & year, delete it first
      if (existingReport) {
        await prisma.monthlyReport.delete({ where: { id: existingReport.id } });
        console.log(`Deleted existing monthly report for ${month}/${year}`);
      }

      // Create new report record with latest data
      await prisma.monthlyReport.create({
        data: {
          userId,
          month,
          year,
          totalExpense: reportData.totalExpense,
          totalIncome: reportData.totalIncome,
          netSavings: reportData.netSavings,
          budgetStatus: reportData.budgetStatus,
          reportData: reportData,
          aiInsights: reportData.aiInsights,
        },
      });

      console.log(`Generated new monthly report for ${month}/${year}`);

      // Generate PDF if requested
      let pdfUrl = null;
      if (generatePdf) {
        try {
          // Get user details for PDF
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, email: true },
          });

          const pdfData: MonthlyReportData = {
            user: {
              name: user?.name || "User",
              email: user?.email || "",
            },
            reportPeriod: {
              month: month.toString(),
              year,
            },
            ...reportData,
          };

          pdfUrl = await this.pdfService.generateMonthlyReportPdf(
            pdfData,
            language
          );
          console.log(`Generated PDF report: ${pdfUrl}`);
        } catch (pdfError) {
          console.warn(`Failed to generate PDF: ${pdfError}`);
          // Continue without PDF if generation fails
        }
      }

      return {
        ...reportData,
        pdfUrl,
        isRecreated: !!existingReport,
        message: existingReport
          ? "Old report replaced with new data"
          : "New report generated",
      };
    } catch (error) {
      throw new Error(`Failed to generate monthly report: ${error}`);
    }
  }

  private async calculateMonthlyData(
    userId: string,
    month: number,
    year: number,
    language: string = "en"
  ) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Get monthly expenses
    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: true,
      },
    });

    // Get monthly deposits (income)
    const deposits = await prisma.deposit.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Get user's budget
    const budget = await prisma.budget.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
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

    // Expense patterns & additional analytics
    const daysInMonth = endDate.getDate();
    const dailyAverage = daysInMonth ? totalExpense / daysInMonth : 0;

    // Week-day spending distribution
    const weekdayAmounts: number[] = new Array(7).fill(0);
    expenses.forEach((exp: any) => {
      const dayIdx = new Date(exp.date).getDay(); // 0 (Sun) – 6 (Sat)
      weekdayAmounts[dayIdx] += Number(exp.amount);
    });
    const weekdaySpending = weekdayAmounts.map((amount, idx) => ({
      day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][idx],
      amount,
      percentage:
        totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
    }));

    // Recurring expenses summary
    const recurringExpenses = expenses.filter((e: any) => e.isRecurring);
    const recurringAmount = recurringExpenses.reduce(
      (sum: number, exp: any) => sum + Number(exp.amount),
      0
    );

    // Compile expense patterns object
    const expensePatterns = {
      dailyAverage,
      recurring: {
        count: recurringExpenses.length,
        amount: recurringAmount,
        percentage:
          totalExpense > 0
            ? Math.round((recurringAmount / totalExpense) * 100)
            : 0,
      },
      weekdaySpending,
      topExpenseNotes: this.getTopExpenseNoteKeywords(expenses),
    };

    // Detect unusual expenses
    const unusualExpenses = this.findUnusualExpenses(expenses);

    // Calculate budget status
    let budgetStatus = "NO_BUDGET";
    if (budget) {
      const spentPercentage = (totalExpense / Number(budget.amountLimit)) * 100;
      if (spentPercentage <= 80) {
        budgetStatus = "UNDER_BUDGET";
      } else if (spentPercentage <= 100) {
        budgetStatus = "ON_TRACK";
      } else {
        budgetStatus = "OVER_BUDGET";
      }
    }

    // Category analysis
    const categoryMap = new Map();
    expenses.forEach((expense: any) => {
      const categoryName = expense.category?.name || "Uncategorized";
      const amount = Number(expense.amount);
      categoryMap.set(
        categoryName,
        (categoryMap.get(categoryName) || 0) + amount
      );
    });

    const categoryAnalysis = Array.from(categoryMap.entries()).map(
      ([name, amount]) => ({
        name,
        amount,
        percentage:
          totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
      })
    );

    // Get year-to-date spending trends
    const spendingTrends = await this.getYearSpendingTrends(userId, year);

    // Generate AI insights
    const monthlyData = {
      totalExpense,
      totalIncome,
      netSavings,
      budgetStatus,
      categoryAnalysis,
      spendingTrends,
      unusualExpenses,
      expensePatterns,
      budget: budget
        ? {
            limit: Number(budget.amountLimit),
            spent: totalExpense,
            percentage: Math.round(
              (totalExpense / Number(budget.amountLimit)) * 100
            ),
          }
        : undefined,
    };

    const aiInsights = await this.generateAiInsights(monthlyData, language);

    return {
      ...monthlyData,
      aiInsights,
    };
  }

  private async getYearSpendingTrends(userId: string, year: number) {
    const trends = [];
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    for (let month = 1; month <= 12; month++) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const expenses = await prisma.expense.findMany({
        where: {
          userId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const totalAmount = expenses.reduce(
        (sum: number, expense: any) => sum + Number(expense.amount),
        0
      );

      trends.push({
        month: months[month - 1],
        amount: totalAmount,
      });
    }

    return trends;
  }

  async generateAiSuggestions(userId: string) {
    try {
      // Get recent financial data
      const last3Months = await this.getLast3MonthsData(userId);
      const currentBudget = await prisma.budget.findFirst({
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
        const savedSuggestion = await prisma.aiSuggestion.create({
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

      const suggestions = await prisma.aiSuggestion.findMany({
        where,
        orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
      });

      return suggestions;
    } catch (error) {
      throw new Error(`Failed to get AI suggestions: ${error}`);
    }
  }

  async markSuggestionAsRead(suggestionId: string) {
    try {
      const suggestion = await prisma.aiSuggestion.update({
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
      const categoryName = expense.category.name;
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

      const expenses = await prisma.expense.findMany({
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
        description: expense.note || expense.category.name,
        amount: Number(expense.amount),
        date: expense.date.toISOString().split("T")[0],
      }))
      .slice(0, 5); // Top 5 unusual expenses

    return unusualExpenses;
  }

  private extractJsonFromMarkdown(text: string): string {
    // Remove markdown code blocks if present
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      return jsonMatch[1].trim();
    }
    // If no markdown blocks, return the text as is
    return text.trim();
  }

  private getTopExpenseNoteKeywords(expenses: any[]): string[] {
    const wordMap = new Map<string, number>();
    expenses.forEach((expense: any) => {
      if (expense.note) {
        expense.note
          .toLowerCase()
          .split(/[\s,.;:"'!?()]+/)
          .filter((w: string) => w.length > 3)
          .forEach((word: string) => {
            wordMap.set(word, (wordMap.get(word) || 0) + 1);
          });
      }
    });

    return Array.from(wordMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  private async generateAiInsights(
    data: any,
    language: string
  ): Promise<{
    summary: string;
    keyInsights: string[];
    recommendations: string[];
    opportunities: string[];
    riskFactors: string[];
  }> {
    const promptTemplate = `You are a professional financial advisor analyzing a monthly expense report. Provide comprehensive, actionable financial insights.

Respond in languge whose language code is ${language}.

FINANCIAL DATA:
- Total Income: ₹${data.totalIncome}
- Total Expenses: ₹${data.totalExpense}
- Net Savings: ₹${data.netSavings}
- Savings Rate: ${
      data.totalIncome > 0
        ? ((data.netSavings / data.totalIncome) * 100).toFixed(1)
        : 0
    }%
- Budget Status: ${data.budgetStatus || "No budget set"}
- Budget Limit: ₹${data.budget?.amount || "N/A"}
- Budget Utilization: ${data.budget?.percentage || "N/A"}%

SPENDING BY CATEGORY:
${data.categoryAnalysis
  .map(
    (cat: any) => `- ${cat.name}: ₹${cat.amount} (${cat.percentage}% of total)`
  )
  .join("\n")}

EXPENSE TRENDS:
${data.spendingTrends
  .map((trend: any) => `- ${trend.month}: ₹${trend.amount}`)
  .join("\n")}

EXPENSE PATTERNS:
- Average Daily Spend: ₹${data.expensePatterns.dailyAverage.toFixed(2)}
- Recurring Expenses: ₹${data.expensePatterns.recurring.amount} (${
      data.expensePatterns.recurring.percentage
    }% of total) across ${data.expensePatterns.recurring.count} transactions
- Weekday Spending: ${data.expensePatterns.weekdaySpending
      .map((w: any) => `${w.day}: ₹${w.amount} (${w.percentage}%)`)
      .join(", ")}
- Common Expense Note Keywords: ${data.expensePatterns.topExpenseNotes.join(
      ", "
    )}

Based on this comprehensive financial data, provide detailed analysis in JSON format with these sections:

{
  "summary": "A comprehensive 2-3 sentence executive summary of the financial health and key highlights",
  "keyInsights": [
    "5-7 specific insights about spending patterns, financial health, and notable trends",
    "Include insights about savings rate, budget performance, category analysis",
    "Highlight any concerning patterns or positive achievements",
    "Compare performance against financial best practices"
  ],
  "recommendations": [
    "5-8 specific, actionable recommendations for improvement",
    "Include strategies for expense reduction and optimization",
    "Provide concrete steps to improve savings rate",
    "Suggest budget adjustments or category rebalancing",
    "Include short-term (1-3 months) actionable steps"
  ],
  "opportunities": [
    "4-6 investment and growth opportunities based on current financial situation",
    "Include specific investment suggestions (index funds, ETFs, emergency fund)",
    "Suggest ways to increase income or optimize existing money",
    "Recommend financial tools, apps, or strategies for wealth building",
    "Include both conservative and growth-oriented options"
  ],
  "riskFactors": [
    "3-5 financial risks and detailed mitigation strategies",
    "Address overspending, inadequate emergency fund, budget issues",
    "Include preventive measures and warning signs to watch",
    "Provide specific action plans to address each risk"
  ]
}

IMPORTANT GUIDELINES:
- Be specific with amounts and percentages when relevant
- Provide actionable advice, not generic tips
- Consider the user's income level for appropriate recommendations
- Include both immediate (this month) and long-term (3-6 months) advice
- Focus on practical, implementable strategies
- Use financial best practices (20% savings rate, 50/30/20 rule, etc.) as benchmarks
- Include specific investment vehicles, apps, or tools when appropriate
- Address emergency fund adequacy (3-6 months of expenses)
- Consider tax implications and optimization strategies
- Provide risk-adjusted advice based on apparent financial stability

Respond ONLY with valid JSON, no additional text or formatting.`;

    try {
      const responseText = await this.callGemini(promptTemplate, 0.3);
      const cleanJson = this.extractJsonFromMarkdown(responseText);
      return JSON.parse(cleanJson);
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

      const expenses = await prisma.expense.findMany({
        where: {
          userId,
          date: { gte: startDate, lte: endDate },
        },
      });

      const deposits = await prisma.deposit.findMany({
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
      const prompt = `\n        Analyze this 3-month financial data and provide personalized suggestions:\n        Monthly Data: ${JSON.stringify(
        monthlyData
      )}\n        Current Budget: ${
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
      }\n        Generate 3-5 suggestions in this JSON format:\n        [\n          {\n            \"title\": \"Suggestion title\",\n            \"suggestion\": \"Detailed suggestion with actionable steps\",\n            \"category\": \"BUDGET|SAVINGS|SPENDING_PATTERN|INVESTMENT\",\n            \"priority\": \"LOW|MEDIUM|HIGH\"\n          }\n        ]\n      `;
      const responseText = await this.callGemini(prompt, 0.4);
      const cleanJson = this.extractJsonFromMarkdown(responseText);
      return JSON.parse(cleanJson);
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
