import { Request, Response } from "express";
import { AiService } from "../services/AiService";

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
      const { month, year } = req.body;
      const report = await this.aiService.generateMonthlyReport(
        userId,
        Number(month),
        Number(year)
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
}
