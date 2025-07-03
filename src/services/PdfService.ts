import puppeteer from "puppeteer";
import Handlebars from "handlebars";
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
  private templatePath: string;
  private outputDir: string;

  constructor() {
    this.templatePath = path.join(__dirname, "../templates");
    this.outputDir = path.join(__dirname, "../../public/reports");

    // Ensure directories exist
    if (!fs.existsSync(this.templatePath)) {
      fs.mkdirSync(this.templatePath, { recursive: true });
    }
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generateMonthlyReportPdf(data: MonthlyReportData): Promise<string> {
    try {
      // Generate HTML from template
      const html = await this.generateHtmlFromTemplate(data);

      // Launch browser and generate PDF
      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });

      // Generate filename
      const filename = `monthly-report-${data.reportPeriod.year}-${String(
        data.reportPeriod.month
      ).padStart(2, "0")}-${Date.now()}.pdf`;
      const filepath = path.join(this.outputDir, filename);

      // Generate PDF
      await page.pdf({
        path: filepath,
        format: "A4",
        printBackground: true,
        margin: {
          top: "20px",
          right: "20px",
          bottom: "20px",
          left: "20px",
        },
      });

      await browser.close();

      // Return the URL path (relative to public directory)
      return `/reports/${filename}`;
    } catch (error) {
      throw new Error(`Failed to generate PDF report: ${error}`);
    }
  }

  private async generateHtmlFromTemplate(
    data: MonthlyReportData
  ): Promise<string> {
    // Create template if it doesn't exist
    await this.ensureTemplateExists();

    // Register Handlebars helpers
    Handlebars.registerHelper("gt", function (a: number, b: number) {
      return a > b;
    });

    Handlebars.registerHelper("not", function (value: any) {
      return !value;
    });

    Handlebars.registerHelper(
      "math",
      function (a: number, operator: string, b: number) {
        switch (operator) {
          case "*":
            return a * b;
          case "+":
            return a + b;
          case "-":
            return a - b;
          case "/":
            return a / b;
          default:
            return 0;
        }
      }
    );

    const templateSource = fs.readFileSync(
      path.join(this.templatePath, "monthly-report.hbs"),
      "utf8"
    );

    const template = Handlebars.compile(templateSource);

    // Prepare data for template
    const templateData = {
      ...data,
      generatedDate: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      monthName: new Date(
        data.reportPeriod.year,
        parseInt(data.reportPeriod.month) - 1
      ).toLocaleDateString("en-US", {
        month: "long",
      }),
      // Helper functions for formatting
      formatCurrency: (amount: number) =>
        `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      getBudgetStatusColor: (status: string) => {
        switch (status) {
          case "UNDER_BUDGET":
            return "#10B981";
          case "ON_TRACK":
            return "#F59E0B";
          case "OVER_BUDGET":
            return "#EF4444";
          default:
            return "#6B7280";
        }
      },
      getBudgetStatusText: (status: string) => {
        switch (status) {
          case "UNDER_BUDGET":
            return "Under Budget";
          case "ON_TRACK":
            return "On Track";
          case "OVER_BUDGET":
            return "Over Budget";
          default:
            return "No Budget Set";
        }
      },
    };

    return template(templateData);
  }

  private async ensureTemplateExists(): Promise<void> {
    const templateFile = path.join(this.templatePath, "monthly-report.hbs");

    if (!fs.existsSync(templateFile)) {
      const templateContent = this.getDefaultTemplate();
      fs.writeFileSync(templateFile, templateContent);
    }
  }

  private getDefaultTemplate(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Monthly Financial Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .header p { font-size: 1.2em; opacity: 0.9; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }
        .summary-card h3 {
            color: #64748b;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }
        .summary-card .value {
            font-size: 2em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .positive { color: #10b981; }
        .negative { color: #ef4444; }
        .neutral { color: #6366f1; }
        .section {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 25px;
            margin-bottom: 25px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .section h2 {
            color: #1e293b;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e2e8f0;
        }
        .chart-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }
        .category-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #f1f5f9;
        }
        .category-item:last-child { border-bottom: none; }
        .category-bar {
            height: 8px;
            background: #e2e8f0;
            border-radius: 4px;
            margin: 5px 0;
            overflow: hidden;
        }
        .category-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            border-radius: 4px;
        }
        .insights-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        .insight-card {
            background: #f8fafc;
            border-left: 4px solid #6366f1;
            padding: 20px;
            border-radius: 0 8px 8px 0;
        }
        .insight-card h3 {
            color: #1e293b;
            margin-bottom: 15px;
            font-size: 1.1em;
        }
        .insight-list {
            list-style: none;
        }
        .insight-list li {
            margin-bottom: 8px;
            padding-left: 20px;
            position: relative;
        }
        .insight-list li:before {
            content: "•";
            color: #6366f1;
            font-weight: bold;
            position: absolute;
            left: 0;
        }
        .trends-chart {
            display: grid;
            grid-template-columns: repeat(12, 1fr);
            gap: 10px;
            margin-top: 20px;
        }
        .trend-bar {
            text-align: center;
            font-size: 0.8em;
        }
        .trend-value {
            background: #e2e8f0;
            border-radius: 4px 4px 0 0;
            margin-bottom: 5px;
            min-height: 20px;
            display: flex;
            align-items: end;
            justify-content: center;
            padding: 5px 2px;
            font-size: 0.7em;
            color: #64748b;
        }
        .footer {
            text-align: center;
            padding: 30px;
            color: #64748b;
            font-size: 0.9em;
            border-top: 1px solid #e2e8f0;
            margin-top: 40px;
        }
        .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.8em;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Monthly Financial Report</h1>
        <p>{{monthName}} {{reportPeriod.year}} • Generated on {{generatedDate}}</p>
        {{#if user.name}}<p>{{user.name}} ({{user.email}})</p>{{/if}}
    </div>

    <div class="container">
        <!-- Financial Summary -->
        <div class="summary-grid">
            <div class="summary-card">
                <h3>Total Income</h3>
                <div class="value positive">\${{totalIncome}}</div>
            </div>
            <div class="summary-card">
                <h3>Total Expenses</h3>
                <div class="value negative">\${{totalExpense}}</div>
            </div>
            <div class="summary-card">
                <h3>Net Savings</h3>
                <div class="value {{#if (gt netSavings 0)}}positive{{else}}negative{{/if}}">\${{netSavings}}</div>
            </div>
            <div class="summary-card">
                <h3>Budget Status</h3>
                <div class="status-badge" style="background-color: {{getBudgetStatusColor budgetStatus}}; color: white;">
                    {{getBudgetStatusText budgetStatus}}
                </div>
                {{#if budget}}
                <div style="margin-top: 10px; font-size: 0.9em; color: #64748b;">
                    \${{budget.spent}} of \${{budget.limit}} ({{budget.percentage}}%)
                </div>
                {{/if}}
            </div>
        </div>

        <!-- Spending Analysis -->
        <div class="section">
            <h2>Spending by Category</h2>
            {{#if categoryAnalysis}}
                {{#each categoryAnalysis}}
                <div class="category-item">
                    <div>
                        <strong>{{name}}</strong>
                        <div class="category-bar">
                            <div class="category-fill" style="width: {{percentage}}%"></div>
                        </div>
                    </div>
                    <div>
                        <strong>\${{amount}}</strong>
                        <div style="font-size: 0.9em; color: #64748b;">{{percentage}}%</div>
                    </div>
                </div>
                {{/each}}
            {{else}}
                <p style="color: #64748b; text-align: center; padding: 20px;">No expenses recorded for this month.</p>
            {{/if}}
        </div>

        <!-- Spending Trends -->
        <div class="section">
            <h2>Year-to-Date Spending Trends</h2>
            <div class="trends-chart">
                {{#each spendingTrends}}
                <div class="trend-bar">
                    <div class="trend-value" style="height: {{#if (gt amount 0)}}{{math amount '*' 2}}px{{else}}20px{{/if}}; background: {{#if (gt amount 0)}}linear-gradient(to top, #667eea, #764ba2){{else}}#f1f5f9{{/if}};">
                        {{#if (gt amount 0)}}\${{amount}}{{/if}}
                    </div>
                    <div>{{month}}</div>
                </div>
                {{/each}}
            </div>
        </div>

        <!-- AI Insights -->
        {{#if aiInsights}}
        <div class="section">
            <h2>AI-Powered Financial Insights</h2>
            
            <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                <h3 style="color: #0369a1; margin-bottom: 10px;">Summary</h3>
                <p>{{aiInsights.summary}}</p>
            </div>

            <div class="insights-grid">
                {{#if aiInsights.keyInsights}}
                <div class="insight-card" style="border-left-color: #10b981;">
                    <h3>Key Insights</h3>
                    <ul class="insight-list">
                        {{#each aiInsights.keyInsights}}
                        <li>{{this}}</li>
                        {{/each}}
                    </ul>
                </div>
                {{/if}}

                {{#if aiInsights.recommendations}}
                <div class="insight-card" style="border-left-color: #f59e0b;">
                    <h3>Recommendations</h3>
                    <ul class="insight-list">
                        {{#each aiInsights.recommendations}}
                        <li>{{this}}</li>
                        {{/each}}
                    </ul>
                </div>
                {{/if}}

                {{#if aiInsights.opportunities}}
                <div class="insight-card" style="border-left-color: #8b5cf6;">
                    <h3>Opportunities</h3>
                    <ul class="insight-list">
                        {{#each aiInsights.opportunities}}
                        <li>{{this}}</li>
                        {{/each}}
                    </ul>
                </div>
                {{/if}}

                {{#if aiInsights.riskFactors}}
                <div class="insight-card" style="border-left-color: #ef4444;">
                    <h3>Risk Factors</h3>
                    <ul class="insight-list">
                        {{#each aiInsights.riskFactors}}
                        <li>{{this}}</li>
                        {{/each}}
                    </ul>
                </div>
                {{/if}}
            </div>
        </div>
        {{/if}}

        <!-- Unusual Expenses -->
        {{#if unusualExpenses}}
        <div class="section">
            <h2>Unusual Expenses</h2>
            {{#each unusualExpenses}}
            <div class="category-item">
                <div>
                    <strong>{{description}}</strong>
                    <div style="font-size: 0.9em; color: #64748b;">{{date}}</div>
                </div>
                <div style="color: #ef4444; font-weight: bold;">\${{amount}}</div>
            </div>
            {{/each}}
        </div>
        {{/if}}
    </div>

    <div class="footer">
        <p>This report was automatically generated by your AI-powered expense tracking system.</p>
        <p>For questions or support, please contact your system administrator.</p>
    </div>
</body>
</html>
    `;
  }
}
