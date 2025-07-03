import { Request, Response } from "express";
import { ExpenseService } from "../services/ExpenseService";

export default class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  createExpense = async (req: Request, res: Response) => {
    try {
      const expenseData = {
        ...req.body,
        userId: req.user?.id || req.body.userId,
      };

      const expense = await this.expenseService.createExpense(expenseData);
      res.status(201).json({ success: true, data: expense });
    } catch (error) {
      res
        .status(400)
        .json({ success: false, message: (error as Error).message });
    }
  };

  getExpensesByUserId = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id || (req.query.userId as string);
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      const expenses = await this.expenseService.getExpensesByUserId(
        userId,
        req.query
      );
      res.status(200).json({ success: true, data: expenses });
    } catch (error) {
      res
        .status(400)
        .json({ success: false, message: (error as Error).message });
    }
  };

  getExpenseById = async (req: Request, res: Response) => {
    try {
      const expense = await this.expenseService.getExpenseById(req.params.id);
      res.status(200).json({ success: true, data: expense });
    } catch (error) {
      res
        .status(404)
        .json({ success: false, message: (error as Error).message });
    }
  };

  updateExpense = async (req: Request, res: Response) => {
    try {
      const expense = await this.expenseService.updateExpense(
        req.params.id,
        req.body
      );
      res.status(200).json({ success: true, data: expense });
    } catch (error) {
      res
        .status(400)
        .json({ success: false, message: (error as Error).message });
    }
  };

  deleteExpense = async (req: Request, res: Response) => {
    try {
      const result = await this.expenseService.deleteExpense(req.params.id);
      res.status(200).json({ success: true, data: null });
    } catch (error) {
      res
        .status(400)
        .json({ success: false, message: (error as Error).message });
    }
  };

  createRecurringExpense = async (req: Request, res: Response) => {
    try {
      const recurringData = {
        ...req.body,
        userId: req.user?.id || req.body.userId,
      };

      const recurring = await this.expenseService.createRecurringExpense(
        recurringData
      );
      res.status(201).json({ success: true, data: recurring });
    } catch (error) {
      res
        .status(400)
        .json({ success: false, message: (error as Error).message });
    }
  };

  getRecurringExpensesByUserId = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id || (req.query.userId as string);
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      const recurrings = await this.expenseService.getRecurringExpensesByUserId(
        userId
      );
      res.status(200).json({ success: true, data: recurrings });
    } catch (error) {
      res
        .status(400)
        .json({ success: false, message: (error as Error).message });
    }
  };

  getExpenseSummary = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id || (req.query.userId as string);
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      const { startDate, endDate } = req.query;
      const summary = await this.expenseService.getExpenseSummary(
        userId,
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.status(200).json({ success: true, data: summary });
    } catch (error) {
      res
        .status(400)
        .json({ success: false, message: (error as Error).message });
    }
  };
}
