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

      // Save PDF
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

    // New page for AI insights
    doc.addPage();
    yPosition = 20;

    // AI Insights
    this.addAiInsights(doc, data, yPosition);

    // Footer on each page
    this.addFooter(doc, currentDate);
  }

  private addSummaryCards(
    doc: jsPDF,
    data: MonthlyReportData,
    yPosition: number
  ): void {
    const cardWidth = 40;
    const cardHeight = 35;
    const cardSpacing = 8;
    const startX = 20;

    const cards = [
      {
        title: "Total Income",
        value: `$${data.totalIncome.toLocaleString()}`,
        isPositive: true,
      },
      {
        title: "Total Expenses",
        value: `$${data.totalExpense.toLocaleString()}`,
        isPositive: false,
      },
      {
        title: "Net Savings",
        value: `$${data.netSavings.toLocaleString()}`,
        isPositive: data.netSavings >= 0,
      },
      {
        title: "Budget Status",
        value: this.getBudgetStatusText(data.budgetStatus),
        isPositive: data.budgetStatus === "UNDER_BUDGET",
      },
    ];

    cards.forEach((card, index) => {
      const x = startX + index * (cardWidth + cardSpacing);

      // Card background
      doc.setFillColor(248, 250, 252);
      doc.rect(x, yPosition, cardWidth, cardHeight, "F");
      doc.setDrawColor(226, 232, 240);
      doc.rect(x, yPosition, cardWidth, cardHeight);

      // Title
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(card.title, x + cardWidth / 2, yPosition + 8, {
        align: "center",
      });

      // Value
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(
        card.isPositive ? 34 : 239,
        card.isPositive ? 197 : 68,
        card.isPositive ? 94 : 68
      );
      doc.text(card.value, x + cardWidth / 2, yPosition + 20, {
        align: "center",
      });

      // Budget details
      if (index === 3 && data.budget) {
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `$${data.budget.spent}/$${data.budget.limit}`,
          x + cardWidth / 2,
          yPosition + 28,
          { align: "center" }
        );
      }
    });
  }

  private addCategoryAnalysis(
    doc: jsPDF,
    data: MonthlyReportData,
    yPosition: number
  ): number {
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Spending by Category", 20, yPosition);
    yPosition += 15;

    if (data.categoryAnalysis && data.categoryAnalysis.length > 0) {
      const tableData = data.categoryAnalysis.map((category) => [
        category.name,
        `$${category.amount.toLocaleString()}`,
        `${category.percentage}%`,
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [["Category", "Amount", "Percentage"]],
        body: tableData,
        theme: "striped",
        headStyles: {
          fillColor: [66, 153, 225],
          textColor: [255, 255, 255],
          fontSize: 10,
        },
        bodyStyles: {
          fontSize: 9,
        },
        margin: { left: 20 },
        columnStyles: {
          1: { halign: "right" },
          2: { halign: "center" },
        },
      });

      return (doc as any).lastAutoTable.finalY + 10;
    } else {
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text("No expenses recorded for this month.", 20, yPosition);
      return yPosition + 15;
    }
  }

  private addSpendingTrends(
    doc: jsPDF,
    data: MonthlyReportData,
    yPosition: number
  ): number {
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Year-to-Date Spending Trends", 20, yPosition);
    yPosition += 15;

    // Simple bar chart
    const chartWidth = 150;
    const chartHeight = 40;
    const barWidth = chartWidth / 12;
    const maxAmount = Math.max(
      ...data.spendingTrends.map((trend) => trend.amount),
      1
    );

    data.spendingTrends.forEach((trend, index) => {
      const barHeight = (trend.amount / maxAmount) * chartHeight;
      const x = 20 + index * barWidth;
      const y = yPosition + chartHeight - barHeight;

      if (trend.amount > 0) {
        doc.setFillColor(66, 153, 225);
        doc.rect(x + 1, y, barWidth - 2, barHeight, "F");
      }

      // Month label
      doc.setFontSize(7);
      doc.setTextColor(0, 0, 0);
      doc.text(trend.month, x + barWidth / 2, yPosition + chartHeight + 8, {
        align: "center",
      });

      // Amount label if significant
      if (trend.amount > 0) {
        doc.setFontSize(6);
        doc.text(`$${trend.amount}`, x + barWidth / 2, y - 2, {
          align: "center",
        });
      }
    });

    return yPosition + chartHeight + 20;
  }

  private addAiInsights(
    doc: jsPDF,
    data: MonthlyReportData,
    yPosition: number
  ): void {
    if (!data.aiInsights) return;

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(
      "🤖 AI-Powered Financial Analysis & Recommendations",
      20,
      yPosition
    );
    yPosition += 20;

    // Executive Summary with enhanced styling
    doc.setFillColor(235, 248, 255);
    doc.setDrawColor(59, 130, 246);
    doc.rect(20, yPosition, 170, 25, "FD");

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 64, 175);
    doc.text("📊 Executive Summary", 25, yPosition + 8);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(45, 55, 72);
    const summaryLines = doc.splitTextToSize(data.aiInsights.summary, 160);
    doc.text(summaryLines, 25, yPosition + 16);

    yPosition += Math.max(30, summaryLines.length * 3 + 15);

    // Enhanced insights sections with icons and better formatting
    const sections = [
      {
        title: "💡 Key Financial Insights",
        items: data.aiInsights.keyInsights,
        color: [59, 130, 246],
        bgColor: [239, 246, 255],
      },
      {
        title: "🎯 Smart Recommendations",
        items: data.aiInsights.recommendations,
        color: [245, 101, 101],
        bgColor: [254, 242, 242],
      },
      {
        title: "📈 Investment & Growth Opportunities",
        items: data.aiInsights.opportunities,
        color: [16, 185, 129],
        bgColor: [236, 253, 245],
      },
      {
        title: "⚠️ Risk Factors & Mitigation",
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

        // Numbered bullets for better readability
        const bulletNumber = `${index + 1}.`;
        doc.setFont("helvetica", "bold");
        doc.text(bulletNumber, 25, yPosition);

        doc.setFont("helvetica", "normal");
        const itemLines = doc.splitTextToSize(item, 155);
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
    doc.text("💰 Financial Health Assessment", 25, yPosition + 8);

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
      doc.text("🚀 Quick Action Items for Next Month", 20, yPosition);
      yPosition += 12;

      actionItems.forEach((action, index) => {
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(45, 55, 72);
        doc.text(`${index + 1}. ${action}`, 25, yPosition);
        yPosition += 5;
      });
    }
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
