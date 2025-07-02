import { Request, Response } from "express";
import { BudgetService } from "../services/BudgetService";

export default class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  createBudget = async (req: Request, res: Response) => {
    try {
      const budget = await this.budgetService.createBudget(req.body);
      res.status(201).json({ success: true, data: budget });
    } catch (error) {
      res
        .status(400)
        .json({ success: false, message: (error as Error).message });
    }
  };

  getBudgetsByUserId = async (req: Request, res: Response) => {
    try {
      const { userId, year } = req.query;
      const budgets = await this.budgetService.getBudgetsByUserId(
        userId as string,
        year ? Number(year) : undefined
      );
      res.status(200).json({ success: true, data: budgets });
    } catch (error) {
      res
        .status(400)
        .json({ success: false, message: (error as Error).message });
    }
  };

  getBudgetById = async (req: Request, res: Response) => {
    try {
      const budget = await this.budgetService.getBudgetById(req.params.id);
      res.status(200).json({ success: true, data: budget });
    } catch (error) {
      res
        .status(404)
        .json({ success: false, message: (error as Error).message });
    }
  };

  updateBudget = async (req: Request, res: Response) => {
    try {
      const budget = await this.budgetService.updateBudget(
        req.params.id,
        req.body
      );
      res.status(200).json({ success: true, data: budget });
    } catch (error) {
      res
        .status(400)
        .json({ success: false, message: (error as Error).message });
    }
  };

  deleteBudget = async (req: Request, res: Response) => {
    try {
      const result = await this.budgetService.deleteBudget(req.params.id);
      res.status(200).json({ success: true, data: null });
    } catch (error) {
      res
        .status(400)
        .json({ success: false, message: (error as Error).message });
    }
  };

  getCurrentBudget = async (req: Request, res: Response) => {
    try {
      const { userId } = req.query;
      const budget = await this.budgetService.getCurrentBudget(
        userId as string
      );
      res.status(200).json({ success: true, data: budget });
    } catch (error) {
      res
        .status(400)
        .json({ success: false, message: (error as Error).message });
    }
  };

  getBudgetAlerts = async (req: Request, res: Response) => {
    try {
      const { userId, isRead } = req.query;
      const alerts = await this.budgetService.getBudgetAlerts(
        userId as string,
        isRead ? isRead === "true" : undefined
      );
      res.status(200).json({ success: true, data: alerts });
    } catch (error) {
      res
        .status(400)
        .json({ success: false, message: (error as Error).message });
    }
  };

  markAlertAsRead = async (req: Request, res: Response) => {
    try {
      const alert = await this.budgetService.markAlertAsRead(req.params.id);
      res.status(200).json({ success: true, data: alert });
    } catch (error) {
      res
        .status(400)
        .json({ success: false, message: (error as Error).message });
    }
  };

  getBudgetSummary = async (req: Request, res: Response) => {
    try {
      const { userId, year } = req.query;
      const summary = await this.budgetService.getBudgetSummary(
        userId as string,
        Number(year)
      );
      res.status(200).json({ success: true, data: summary });
    } catch (error) {
      res
        .status(400)
        .json({ success: false, message: (error as Error).message });
    }
  };

  recalculateBudgetSpending = async (req: Request, res: Response) => {
    try {
      const result = await this.budgetService.recalculateBudgetSpending(
        req.params.id
      );
      res.status(200).json({ success: true, data: null });
    } catch (error) {
      res
        .status(400)
        .json({ success: false, message: (error as Error).message });
    }
  };
}
