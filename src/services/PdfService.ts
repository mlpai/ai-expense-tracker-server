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

export class PdfService {
  private outputDir: string;

  constructor() {
    this.outputDir = path.join(__dirname, "../../public/reports");

    // Ensure directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generateMonthlyReportPdf(data: MonthlyReportData): Promise<string> {
    try {
      console.log("Starting jsPDF generation...");
      console.log("Output directory:", this.outputDir);

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
      const filepath = path.join(this.outputDir, filename);

      // Generate PDF content
      this.generatePdfContent(doc, data);

      // Save PDF
      doc.save(filepath);
      console.log("PDF saved to:", filepath);

      // Check if file exists
      if (fs.existsSync(filepath)) {
        const stats = fs.statSync(filepath);
        console.log("PDF file exists, size:", stats.size, "bytes");
      } else {
        console.log("PDF file does not exist at:", filepath);
      }

      return `/reports/${filename}`;
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
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Header with gradient background effect
    doc.setFillColor(66, 153, 225); // Blue color
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 40, "F");

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("Monthly Financial Report", pageWidth / 2, yPosition + 15, {
      align: "center",
    });

    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${monthName} ${data.reportPeriod.year}`,
      pageWidth / 2,
      yPosition + 25,
      { align: "center" }
    );

    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    doc.text(`Generated on ${currentDate}`, pageWidth / 2, yPosition + 35, {
      align: "center",
    });

    yPosition += 55;

    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Financial Summary Cards
    this.addSummaryCards(doc, data, yPosition);
    yPosition += 60;

    // Category Analysis
    yPosition = this.addCategoryAnalysis(doc, data, yPosition);
    yPosition += 10;

    // Spending Trends Chart
    yPosition = this.addSpendingTrends(doc, data, yPosition);

    // Check if we need a new page for AI insights
    if (yPosition > pageHeight - 100) {
      doc.addPage();
      yPosition = margin;
    } else {
      yPosition += 20;
    }

    // AI Insights
    yPosition = this.addAiInsights(doc, data, yPosition);

    // Footer
    this.addFooter(doc, currentDate);
  }

  private addSummaryCards(
    doc: jsPDF,
    data: MonthlyReportData,
    yPosition: number
  ): void {
    const cardWidth = 40;
    const cardHeight = 35;
    const cardSpacing = 10;
    const startX = 20;

    const cards = [
      {
        title: "Total Income",
        value: `$${data.totalIncome.toLocaleString()}`,
        color: [34, 197, 94],
      },
      {
        title: "Total Expenses",
        value: `$${data.totalExpense.toLocaleString()}`,
        color: [239, 68, 68],
      },
      {
        title: "Net Savings",
        value: `$${data.netSavings.toLocaleString()}`,
        color: data.netSavings >= 0 ? [34, 197, 94] : [239, 68, 68],
      },
      {
        title: "Budget Status",
        value: this.getBudgetStatusText(data.budgetStatus),
        color: this.getBudgetStatusColor(data.budgetStatus),
      },
    ];

    cards.forEach((card, index) => {
      const x = startX + index * (cardWidth + cardSpacing);

      // Card background
      doc.setFillColor(248, 250, 252);
      doc.rect(x, yPosition, cardWidth, cardHeight, "F");

      // Card border
      doc.setDrawColor(226, 232, 240);
      doc.rect(x, yPosition, cardWidth, cardHeight);

      // Title
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(113, 128, 150);
      doc.text(card.title.toUpperCase(), x + cardWidth / 2, yPosition + 8, {
        align: "center",
      });

      // Value
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(card.color[0], card.color[1], card.color[2]);
      doc.text(card.value, x + cardWidth / 2, yPosition + 20, {
        align: "center",
      });

      // Budget details if applicable
      if (index === 3 && data.budget) {
        doc.setFontSize(7);
        doc.setTextColor(113, 128, 150);
        doc.text(
          `$${data.budget.spent} of $${data.budget.limit}`,
          x + cardWidth / 2,
          yPosition + 28,
          { align: "center" }
        );
        doc.text(
          `(${data.budget.percentage}%)`,
          x + cardWidth / 2,
          yPosition + 32,
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
    // Section title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(45, 55, 72);
    doc.text("Spending by Category", 20, yPosition);
    yPosition += 15;

    if (data.categoryAnalysis && data.categoryAnalysis.length > 0) {
      // Create table data
      const tableData = data.categoryAnalysis.map((category) => [
        category.name,
        `$${category.amount.toLocaleString()}`,
        `${category.percentage}%`,
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [["Category", "Amount", "Percentage"]],
        body: tableData,
        theme: "grid",
        headStyles: {
          fillColor: [66, 153, 225],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: "bold",
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [45, 55, 72],
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        margin: { left: 20, right: 20 },
        tableWidth: "auto",
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 40, halign: "right" },
          2: { cellWidth: 30, halign: "center" },
        },
      });

      return (doc as any).lastAutoTable.finalY + 10;
    } else {
      doc.setFontSize(10);
      doc.setTextColor(113, 128, 150);
      doc.text("No expenses recorded for this month.", 20, yPosition);
      return yPosition + 15;
    }
  }

  private addSpendingTrends(
    doc: jsPDF,
    data: MonthlyReportData,
    yPosition: number
  ): number {
    // Section title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(45, 55, 72);
    doc.text("Year-to-Date Spending Trends", 20, yPosition);
    yPosition += 15;

    // Simple bar chart
    const chartWidth = 150;
    const chartHeight = 40;
    const barWidth = chartWidth / 12;
    const maxAmount = Math.max(
      ...data.spendingTrends.map((trend) => trend.amount)
    );

    // Chart background
    doc.setFillColor(248, 250, 252);
    doc.rect(20, yPosition, chartWidth, chartHeight, "F");

    // Draw bars
    data.spendingTrends.forEach((trend, index) => {
      const barHeight =
        maxAmount > 0 ? (trend.amount / maxAmount) * (chartHeight - 10) : 0;
      const x = 20 + index * barWidth + 2;
      const y = yPosition + chartHeight - barHeight - 5;

      if (barHeight > 0) {
        doc.setFillColor(66, 153, 225);
        doc.rect(x, y, barWidth - 4, barHeight, "F");

        // Amount label
        if (barHeight > 8) {
          doc.setFontSize(6);
          doc.setTextColor(255, 255, 255);
          doc.text(
            `$${trend.amount}`,
            x + (barWidth - 4) / 2,
            y + barHeight / 2,
            { align: "center" }
          );
        }
      }

      // Month label
      doc.setFontSize(7);
      doc.setTextColor(74, 85, 104);
      doc.text(
        trend.month,
        x + (barWidth - 4) / 2,
        yPosition + chartHeight + 8,
        { align: "center" }
      );
    });

    return yPosition + chartHeight + 15;
  }

  private addAiInsights(
    doc: jsPDF,
    data: MonthlyReportData,
    yPosition: number
  ): number {
    if (!data.aiInsights) return yPosition;

    // Section title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(45, 55, 72);
    doc.text("AI-Powered Financial Insights", 20, yPosition);
    yPosition += 15;

    // Executive Summary box
    doc.setFillColor(235, 248, 255);
    doc.setDrawColor(144, 205, 244);
    doc.rect(20, yPosition, 170, 25, "FD");

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(43, 108, 176);
    doc.text("Executive Summary", 25, yPosition + 8);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(45, 55, 72);
    const summaryLines = doc.splitTextToSize(data.aiInsights.summary, 160);
    doc.text(summaryLines, 25, yPosition + 15);

    yPosition += 35;

    // Insights sections
    const sections = [
      {
        title: "Key Insights",
        items: data.aiInsights.keyInsights,
        color: [66, 153, 225],
      },
      {
        title: "Recommendations",
        items: data.aiInsights.recommendations,
        color: [237, 137, 54],
      },
      {
        title: "Opportunities",
        items: data.aiInsights.opportunities,
        color: [56, 161, 105],
      },
      {
        title: "Risk Factors",
        items: data.aiInsights.riskFactors,
        color: [229, 62, 62],
      },
    ];

    sections.forEach((section, index) => {
      if (!section.items || section.items.length === 0) return;

      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      // Section header
      doc.setFillColor(section.color[0], section.color[1], section.color[2]);
      doc.rect(20, yPosition, 170, 8, "F");

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(section.title, 25, yPosition + 5.5);

      yPosition += 12;

      // Section items
      section.items.forEach((item, itemIndex) => {
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(45, 55, 72);

        const bulletPoint = "•";
        doc.text(bulletPoint, 25, yPosition);

        const itemLines = doc.splitTextToSize(item, 160);
        doc.text(itemLines, 30, yPosition);

        yPosition += itemLines.length * 4 + 2;
      });

      yPosition += 5;
    });

    return yPosition;
  }

  private addFooter(doc: jsPDF, currentDate: string): void {
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Footer line
    doc.setDrawColor(226, 232, 240);
    doc.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20);

    // Footer text
    doc.setFontSize(8);
    doc.setTextColor(113, 128, 150);
    doc.text(
      "This report was automatically generated by your AI-powered expense tracking system.",
      pageWidth / 2,
      pageHeight - 12,
      { align: "center" }
    );
    doc.text(
      `Generated on ${currentDate} • For support, contact your system administrator.`,
      pageWidth / 2,
      pageHeight - 7,
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

  private getBudgetStatusColor(status: string): [number, number, number] {
    switch (status) {
      case "UNDER_BUDGET":
        return [34, 197, 94];
      case "ON_TRACK":
        return [245, 158, 11];
      case "OVER_BUDGET":
        return [239, 68, 68];
      default:
        return [107, 114, 128];
    }
  }
}
