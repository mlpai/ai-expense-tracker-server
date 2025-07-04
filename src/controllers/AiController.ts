import { Request, Response } from "express";
import { AiService } from "../services/AiService";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";
import { prisma } from "../utils/prisma";

export default class AiController {
  constructor(private readonly aiService: AiService) {}

  generateMonthlyReport = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }
      const { month, year, generatePdf = true, language = "en" } = req.body;
      const report = await this.aiService.generateMonthlyReport(
        userId,
        Number(month),
        Number(year),
        Boolean(generatePdf),
        language
      );
      res.status(200).json({ success: true, data: report });
    } catch (error) {
      res
        .status(400)
        .json({ success: false, message: (error as Error).message });
    }
  };

  generateAiSuggestions = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }
      const suggestions = await this.aiService.generateAiSuggestions(userId);
      res.status(200).json({ success: true, data: suggestions });
    } catch (error) {
      res
        .status(400)
        .json({ success: false, message: (error as Error).message });
    }
  };

  getAiSuggestions = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }
      const { category, isRead } = req.query;
      const suggestions = await this.aiService.getAiSuggestions(
        userId,
        category as string,
        isRead ? isRead === "true" : undefined
      );
      res.status(200).json({ success: true, data: suggestions });
    } catch (error) {
      res
        .status(400)
        .json({ success: false, message: (error as Error).message });
    }
  };

  markSuggestionAsRead = async (req: Request, res: Response) => {
    try {
      const suggestion = await this.aiService.markSuggestionAsRead(
        req.params.id
      );
      res.status(200).json({ success: true, data: suggestion });
    } catch (error) {
      res
        .status(400)
        .json({ success: false, message: (error as Error).message });
    }
  };

  async listUserReports(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        return res.status(401).json({ error: "No token provided" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const userId = decoded.userId;

      // Get all reports for the user
      const reports = await prisma.monthlyReport.findMany({
        where: { userId },
        orderBy: [{ year: "desc" }, { month: "desc" }],
        select: {
          id: true,
          month: true,
          year: true,
          totalExpense: true,
          totalIncome: true,
          netSavings: true,
          budgetStatus: true,
          generatedAt: true,
        },
      });

      // Check if user has PDF files in their directory
      const userEmail = decoded.email || "";
      const userFolderName = userEmail.replace(/[^a-zA-Z0-9]/g, "_");
      const userReportsPath = path.join(
        __dirname,
        "../../public/reports",
        userFolderName
      );

      let pdfFiles: string[] = [];
      if (fs.existsSync(userReportsPath)) {
        pdfFiles = fs
          .readdirSync(userReportsPath)
          .filter((file) => file.endsWith(".pdf"))
          .map((file) => `/reports/${userFolderName}/${file}`);
      }

      // Enhance reports with PDF URLs if available
      const reportsWithPdfs = reports.map((report) => {
        const matchingPdf = pdfFiles.find((pdf) =>
          pdf.includes(
            `-${report.year}-${String(report.month).padStart(2, "0")}-`
          )
        );
        return {
          ...report,
          pdfUrl: matchingPdf || null,
          savingsRate:
            report.totalIncome.toNumber() > 0
              ? (
                  (report.netSavings.toNumber() /
                    report.totalIncome.toNumber()) *
                  100
                ).toFixed(1)
              : "0",
          monthName: new Date(report.year, report.month - 1).toLocaleString(
            "default",
            { month: "long" }
          ),
        };
      });

      res.json({
        success: true,
        reports: reportsWithPdfs,
        totalReports: reportsWithPdfs.length,
      });
    } catch (error) {
      console.error("Error listing user reports:", error);
      res.status(500).json({
        error: "Failed to list reports",
        details: error,
      });
    }
  }
}
