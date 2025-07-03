import { ExpenseCategoryService } from "../services/ExpenseCategoryService";
import { Request, Response } from "express";

export default class ExpenseCategoryController {
  constructor(
    private readonly expenseCategoryService: ExpenseCategoryService
  ) {}

  getAllCategories = async (req: Request, res: Response) => {
    try {
      const categories = await this.expenseCategoryService.getAllCategories();
      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
        status: 500,
      });
    }
  };

  getCategoryById = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const category = await this.expenseCategoryService.getCategoryById(id);

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Expense category not found",
          status: 404,
        });
      }

      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
        status: 500,
      });
    }
  };

  createCategory = async (req: Request, res: Response) => {
    try {
      const category = await this.expenseCategoryService.createCategory(
        req.body
      );
      res.status(201).json({
        success: true,
        data: category,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Bad request",
        status: 400,
      });
    }
  };

  updateCategory = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const updateData = req.body;
      const category = await this.expenseCategoryService.updateCategory(
        id,
        updateData
      );
      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Bad request",
        status: 400,
      });
    }
  };

  deleteCategory = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      await this.expenseCategoryService.deleteCategory(id);
      res.status(200).json({
        success: true,
        message: "Expense category deleted successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Bad request",
        status: 400,
      });
    }
  };
}
