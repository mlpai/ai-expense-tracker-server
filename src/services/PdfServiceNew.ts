import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import path from "path";
import fs from "fs";

export interface MonthlyReportData {
  user: {
    name: string;
    email: string;
  };
  reportPeriod: {
    month: string;
    year: number;
  };
  totalExpense: number;
  totalIncome: number;
  netSavings: number;
  budgetStatus: string;
  categoryAnalysis: Array<{
    name: string;
    amount: number;
    percentage: number;
  }>;
  spendingTrends: Array<{
    month: string;
    amount: number;
  }>;
  unusualExpenses: Array<{
    description: string;
    amount: number;
    date: string;
  }>;
  expensePatterns?: {
    dailyAverage: number;
    recurring: {
      count: number;
      amount: number;
      percentage: number;
    };
    weekdaySpending: Array<{
      day: string;
      amount: number;
      percentage: number;
    }>;
    topExpenseNotes: string[];
  };
  aiInsights: {
    summary: string;
    keyInsights: string[];
    recommendations: string[];
    riskFactors: string[];
    opportunities: string[];
  };
  budget?: {
    limit: number;
    spent: number;
    percentage: number;
  };
}

export class PdfServiceNew {
  private outputDir: string;

  constructor() {
    this.outputDir = path.join(__dirname, "../../public/reports");

    // Ensure base directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generateMonthlyReportPdf(data: MonthlyReportData): Promise<string> {
    try {
      console.log("Starting jsPDF generation...");

      // Create user-specific folder
      const userFolder = path.join(
        this.outputDir,
        data.user.email.replace(/[^a-zA-Z0-9]/g, "_")
      );
      if (!fs.existsSync(userFolder)) {
        fs.mkdirSync(userFolder, { recursive: true });
      }
      console.log("User folder:", userFolder);

      // Remove old PDFs for the same month/year before generating new one
      const periodPrefix = `monthly-report-${data.reportPeriod.year}-${String(
        data.reportPeriod.month
      ).padStart(2, "0")}`;
      fs.readdirSync(userFolder)
        .filter((f) => f.startsWith(periodPrefix) && f.endsWith(".pdf"))
        .forEach((oldFile) => {
          try {
            fs.unlinkSync(path.join(userFolder, oldFile));
            console.log("Deleted old report:", oldFile);
          } catch (err) {
            console.warn("Could not delete old report", oldFile, err);
          }
        });

      // Create new PDF document
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Generate filename
      const filename = `monthly-report-${data.reportPeriod.year}-${String(
        data.reportPeriod.month
      ).padStart(2, "0")}-${Date.now()}.pdf`;
      const filepath = path.join(userFolder, filename);

      // Generate PDF content
      this.generatePdfContent(doc, data);

      // Save PDF and rewrite the file if it already exists
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      doc.save(filepath);
      console.log("PDF saved to:", filepath);

      // Check if file exists
      if (fs.existsSync(filepath)) {
        const stats = fs.statSync(filepath);
        console.log("PDF file exists, size:", stats.size, "bytes");
      }

      // Return user-specific path
      const userFolderName = data.user.email.replace(/[^a-zA-Z0-9]/g, "_");
      return `/reports/${userFolderName}/${filename}`;
    } catch (error) {
      console.error("jsPDF generation error:", error);
      throw new Error(`Failed to generate PDF report: ${error}`);
    }
  }

  private generatePdfContent(doc: jsPDF, data: MonthlyReportData): void {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const monthName = monthNames[parseInt(data.reportPeriod.month) - 1];

    // Page setup
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Header with background
    doc.setFillColor(66, 153, 225);
    doc.rect(20, yPosition, pageWidth - 40, 40, "F");

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("Monthly Financial Report", pageWidth / 2, yPosition + 15, {
      align: "center",
    });

    doc.setFontSize(14);
    doc.text(
      `${monthName} ${data.reportPeriod.year}`,
      pageWidth / 2,
      yPosition + 25,
      { align: "center" }
    );

    const currentDate = new Date().toLocaleDateString();
    doc.text(`Generated: ${currentDate}`, pageWidth / 2, yPosition + 35, {
      align: "center",
    });

    yPosition += 55;
    doc.setTextColor(0, 0, 0);

    // Financial Summary Cards
    this.addSummaryCards(doc, data, yPosition);
    yPosition += 60;

    // Category Analysis
    yPosition = this.addCategoryAnalysis(doc, data, yPosition);
    yPosition += 15;

    // Spending Trends
    yPosition = this.addSpendingTrends(doc, data, yPosition);

    // Expense Patterns
    yPosition = this.addExpensePatterns(doc, data, yPosition);

    // New page for AI insights
    doc.addPage();
    yPosition = 20;

    // AI Insights
    this.addAiInsights(doc, data, yPosition);

    // Footer on each page
    this.addFooter(doc, currentDate);
  }

  private addHeader(doc: jsPDF, data: MonthlyReportData): void {
    // Header background
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 40, "F");

    // Title
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("Monthly Financial Report", 20, 20);

    // Subtitle
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${data.reportPeriod.month}/${data.reportPeriod.year} - ${this.cleanText(
        data.user.name
      )}`,
      20,
      30
    );

    // Reset colors
    doc.setTextColor(0, 0, 0);
  }

  private addSummaryCards(
    doc: jsPDF,
    data: MonthlyReportData,
    yPosition: number
  ): number {
    const cardWidth = 50;
    const cardHeight = 25;
    const cardSpacing = 5;

    const cards = [
      {
        title: "Total Income",
        value: `₹${data.totalIncome.toLocaleString("en-IN")}`,
        color: [34, 197, 94], // green
        bgColor: [240, 253, 244],
      },
      {
        title: "Total Expenses",
        value: `₹${data.totalExpense.toLocaleString("en-IN")}`,
        color: [239, 68, 68], // red
        bgColor: [254, 242, 242],
      },
      {
        title: "Net Savings",
        value: `₹${data.netSavings.toLocaleString("en-IN")}`,
        color: data.netSavings >= 0 ? [34, 197, 94] : [239, 68, 68],
        bgColor: data.netSavings >= 0 ? [240, 253, 244] : [254, 242, 242],
      },
    ];

    cards.forEach((card, index) => {
      const xPos = 20 + (cardWidth + cardSpacing) * index;

      // Card background
      doc.setFillColor(card.bgColor[0], card.bgColor[1], card.bgColor[2]);
      doc.rect(xPos, yPosition, cardWidth, cardHeight, "F");

      // Card border
      doc.setDrawColor(card.color[0], card.color[1], card.color[2]);
      doc.rect(xPos, yPosition, cardWidth, cardHeight);

      // Title
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(this.cleanText(card.title), xPos + 2, yPosition + 6);

      // Value
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(card.color[0], card.color[1], card.color[2]);
      doc.text(this.cleanText(card.value), xPos + 2, yPosition + 15);

      // Status indicator
      if (index === 2) {
        // Net Savings card
        const status = data.netSavings >= 0 ? "Positive" : "Negative";
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text(status, xPos + 2, yPosition + 22);
      }
    });

    return yPosition + cardHeight + 10;
  }

  private addCategoryAnalysis(
    doc: jsPDF,
    data: MonthlyReportData,
    yPosition: number
  ): number {
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Spending by Category", 20, yPosition);
    yPosition += 10;

    if (!data.categoryAnalysis || data.categoryAnalysis.length === 0) {
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text("No expenses recorded for this month", 20, yPosition);
      return yPosition + 15;
    }

    // Prepare table data
    const head = [["Category", "Amount (₹)", "Percentage"]];
    const body = data.categoryAnalysis.map((c: any) => [
      this.cleanText(c.name || "Uncategorized"),
      Number(c.amount).toLocaleString("en-IN"),
      `${c.percentage}%`,
    ]);

    // Use autoTable to render neatly
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    autoTable(doc, {
      head,
      body,
      startY: yPosition,
      theme: "grid",
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: 0,
        fontStyle: "bold",
      },
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 2,
      },
      columnStyles: {
        1: { halign: "right" },
        2: { halign: "right" },
      },
    });

    // Retrieve the Y coordinate after table to continue content
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : yPosition;
    return finalY + 10;
  }

  private addSpendingTrends(
    doc: jsPDF,
    data: MonthlyReportData,
    yPosition: number
  ): number {
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Year-to-Date Spending Trends", 20, yPosition);
    yPosition += 15;

    if (!data.spendingTrends || data.spendingTrends.length === 0) {
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text("No spending trend data available", 20, yPosition);
      return yPosition + 15;
    }

    // Simple bar chart representation
    const chartWidth = 150;
    const chartHeight = 40;
    const chartX = 20;
    const chartY = yPosition;

    // Find max amount for scaling
    const maxAmount = Math.max(
      ...data.spendingTrends.map((trend: any) => Number(trend.amount))
    );

    if (maxAmount === 0) {
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text("No spending data to display", 20, yPosition);
      return yPosition + 15;
    }

    // Draw chart background
    doc.setFillColor(248, 248, 248);
    doc.rect(chartX, chartY, chartWidth, chartHeight, "F");
    doc.setDrawColor(200, 200, 200);
    doc.rect(chartX, chartY, chartWidth, chartHeight);

    // Draw bars
    const barWidth = chartWidth / data.spendingTrends.length;

    data.spendingTrends.forEach((trend: any, index: number) => {
      const amount = Number(trend.amount);
      const barHeight = (amount / maxAmount) * (chartHeight - 5);
      const barX = chartX + index * barWidth + 2;
      const barY = chartY + chartHeight - barHeight - 2;

      // Draw bar
      doc.setFillColor(59, 130, 246);
      doc.rect(barX, barY, barWidth - 4, barHeight, "F");

      // Month label
      doc.setFontSize(7);
      doc.setTextColor(0, 0, 0);
      const cleanMonth = this.cleanText(trend.month || "");
      doc.text(
        cleanMonth,
        barX + (barWidth - 4) / 2,
        chartY + chartHeight + 8,
        { align: "center" }
      );
    });

    // Chart title
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Max: ₹${maxAmount.toLocaleString("en-IN")}`,
      chartX + chartWidth - 30,
      chartY - 2
    );

    return yPosition + chartHeight + 20;
  }

  private addExpensePatterns(
    doc: jsPDF,
    data: MonthlyReportData,
    yPosition: number
  ): number {
    if (!data.expensePatterns) return yPosition;

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Expense Patterns", 20, yPosition);
    yPosition += 15;

    // Expense Patterns content
    const { dailyAverage, recurring, weekdaySpending, topExpenseNotes } =
      data.expensePatterns;

    // Build table rows
    const rows: Array<[string, string]> = [];
    rows.push([
      "Daily Avg Spend",
      `₹${dailyAverage.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    ]);

    rows.push([
      "Recurring Expenses",
      `${recurring.count} txn${
        recurring.count !== 1 ? "s" : ""
      }  |  ₹${recurring.amount.toLocaleString("en-IN")}  (${
        recurring.percentage
      }%)`,
    ]);

    const topWeekdays = [...weekdaySpending]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
    rows.push([
      "Busiest Weekdays",
      topWeekdays.map((w) => `${w.day} (${w.percentage}%)`).join(", "),
    ]);

    rows.push([
      "Common Note Keywords",
      topExpenseNotes && topExpenseNotes.length > 0
        ? topExpenseNotes.join(", ")
        : "—",
    ]);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    autoTable(doc, {
      head: [["Metric", "Value"]],
      body: rows,
      startY: yPosition,
      theme: "striped",
      headStyles: { fillColor: [240, 240, 240], textColor: 0 },
      styles: { font: "helvetica", fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 110 },
      },
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : yPosition;
    yPosition = finalY;

    return yPosition + 10;
  }

  private addAiInsights(
    doc: jsPDF,
    data: MonthlyReportData,
    yPosition: number
  ): void {
    if (!data.aiInsights) return;

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("AI-Powered Financial Analysis & Recommendations", 20, yPosition);
    yPosition += 20;

    // Executive Summary with enhanced styling
    doc.setFillColor(235, 248, 255);
    doc.setDrawColor(59, 130, 246);
    doc.rect(20, yPosition, 170, 25, "FD");

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 64, 175);
    doc.text("Executive Summary", 25, yPosition + 8);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(45, 55, 72);
    const summaryLines = doc.splitTextToSize(data.aiInsights.summary, 160);
    doc.text(summaryLines, 25, yPosition + 16);

    yPosition += Math.max(30, summaryLines.length * 3 + 15);

    // Enhanced insights sections with better formatting
    const sections = [
      {
        title: "Key Financial Insights",
        items: data.aiInsights.keyInsights,
        color: [59, 130, 246],
        bgColor: [239, 246, 255],
      },
      {
        title: "Smart Recommendations",
        items: data.aiInsights.recommendations,
        color: [245, 101, 101],
        bgColor: [254, 242, 242],
      },
      {
        title: "Investment & Growth Opportunities",
        items: data.aiInsights.opportunities,
        color: [16, 185, 129],
        bgColor: [236, 253, 245],
      },
      {
        title: "Risk Factors & Mitigation",
        items: data.aiInsights.riskFactors,
        color: [245, 101, 101],
        bgColor: [254, 242, 242],
      },
    ];

    // Add enhanced sections
    sections.forEach((section) => {
      if (!section.items || section.items.length === 0) return;

      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }

      // Section header with background
      doc.setFillColor(
        section.bgColor[0],
        section.bgColor[1],
        section.bgColor[2]
      );
      doc.rect(20, yPosition, 170, 12, "F");
      doc.setDrawColor(section.color[0], section.color[1], section.color[2]);
      doc.rect(20, yPosition, 170, 12);

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(section.color[0], section.color[1], section.color[2]);
      doc.text(section.title, 25, yPosition + 8);
      yPosition += 18;

      // Section items with enhanced formatting
      section.items.forEach((item, index) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(45, 55, 72);

        // Clean text to remove any special characters
        const cleanItem = this.cleanText(item);

        // Numbered bullets for better readability
        const bulletNumber = `${index + 1}.`;
        doc.setFont("helvetica", "bold");
        doc.text(bulletNumber, 25, yPosition);

        doc.setFont("helvetica", "normal");
        const itemLines = doc.splitTextToSize(cleanItem, 155);
        doc.text(itemLines, 32, yPosition);
        yPosition += itemLines.length * 3.5 + 3;
      });

      yPosition += 8;
    });

    // Add additional financial planning sections if space allows
    if (yPosition < 220) {
      this.addFinancialPlanningTips(doc, data, yPosition);
    }
  }

  private addFinancialPlanningTips(
    doc: jsPDF,
    data: MonthlyReportData,
    yPosition: number
  ): void {
    // Check if we need a new page
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }

    // Financial Health Score section
    doc.setFillColor(255, 251, 235);
    doc.setDrawColor(245, 158, 11);
    doc.rect(20, yPosition, 170, 30, "FD");

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(180, 83, 9);
    doc.text("Financial Health Assessment", 25, yPosition + 8);

    // Calculate financial health score
    const savingsRate =
      data.totalIncome > 0 ? (data.netSavings / data.totalIncome) * 100 : 0;
    const healthScore = this.calculateFinancialHealthScore(data, savingsRate);

    doc.setFontSize(9);
    doc.setTextColor(45, 55, 72);
    doc.text(`Financial Health Score: ${healthScore}/100`, 25, yPosition + 16);
    doc.text(`Savings Rate: ${savingsRate.toFixed(1)}%`, 25, yPosition + 21);
    doc.text(
      `Budget Utilization: ${data.budget ? data.budget.percentage : "N/A"}%`,
      25,
      yPosition + 26
    );

    yPosition += 40;

    // Quick action items
    const actionItems = this.generateActionItems(data, savingsRate);
    if (actionItems.length > 0) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(16, 185, 129);
      doc.text("Quick Action Items for Next Month", 20, yPosition);
      yPosition += 12;

      actionItems.forEach((action, index) => {
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(45, 55, 72);
        const cleanAction = this.cleanText(action);
        doc.text(`${index + 1}. ${cleanAction}`, 25, yPosition);
        yPosition += 5;
      });
    }
  }

  private cleanText(text: string): string {
    if (!text) return "";

    // Remove emoji and special characters that cause encoding issues
    return text
      .replace(/[\u{1F600}-\u{1F64F}]/gu, "") // emoticons
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, "") // misc symbols
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, "") // transport
      .replace(/[\u{2600}-\u{26FF}]/gu, "") // misc symbols
      .replace(/[\u{2700}-\u{27BF}]/gu, "") // dingbats
      .replace(/[\u{1F900}-\u{1F9FF}]/gu, "") // supplemental symbols
      .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, "") // flags
      .replace(/[^\x00-\x7F]/g, "") // remove non-ASCII characters
      .trim();
  }

  private calculateFinancialHealthScore(
    data: MonthlyReportData,
    savingsRate: number
  ): number {
    let score = 0;

    // Savings rate (40 points max)
    if (savingsRate >= 20) score += 40;
    else if (savingsRate >= 10) score += 30;
    else if (savingsRate >= 5) score += 20;
    else if (savingsRate > 0) score += 10;

    // Budget adherence (30 points max)
    if (data.budgetStatus === "UNDER_BUDGET") score += 30;
    else if (data.budgetStatus === "ON_TRACK") score += 25;
    else if (data.budgetStatus === "OVER_BUDGET") score += 10;

    // Expense diversity (20 points max)
    const categoryCount = data.categoryAnalysis.length;
    if (categoryCount >= 5) score += 20;
    else if (categoryCount >= 3) score += 15;
    else if (categoryCount >= 2) score += 10;
    else score += 5;

    // Income vs expenses ratio (10 points max)
    if (data.netSavings > 0) score += 10;
    else if (data.netSavings === 0) score += 5;

    return Math.min(score, 100);
  }

  private generateActionItems(
    data: MonthlyReportData,
    savingsRate: number
  ): string[] {
    const actions: string[] = [];

    if (savingsRate < 10) {
      actions.push("Increase savings rate to at least 10% of income");
    }

    if (data.budgetStatus === "OVER_BUDGET") {
      actions.push("Review and reduce expenses in top spending categories");
    }

    if (data.categoryAnalysis.length === 1) {
      actions.push(
        "Diversify spending across multiple categories for better tracking"
      );
    }

    if (data.netSavings > data.totalIncome * 0.2) {
      actions.push(
        "Consider investing excess savings in diversified portfolio"
      );
    }

    if (!data.budget) {
      actions.push("Set up a monthly budget for better financial control");
    }

    actions.push("Track expenses daily for better awareness");
    actions.push("Review and optimize recurring subscriptions");

    return actions.slice(0, 5); // Return max 5 action items
  }

  private addFooter(doc: jsPDF, currentDate: string): void {
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      "Generated by AI-powered expense tracking system",
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }

  private getBudgetStatusText(status: string): string {
    switch (status) {
      case "UNDER_BUDGET":
        return "Under Budget";
      case "ON_TRACK":
        return "On Track";
      case "OVER_BUDGET":
        return "Over Budget";
      default:
        return "No Budget";
    }
  }
}
