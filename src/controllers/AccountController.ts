import { AccountService } from "../services/AccountService";
import { Request, Response } from "express";

export default class AccountController {
  constructor(private readonly accountService: AccountService) {}

  getAccountsByUserId = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id || (req.query.userId as string);
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      const accounts = await this.accountService.getAccountsByUserId(userId);
      res.status(200).json({
        success: true,
        data: accounts,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      });
    }
  };

  getAccountById = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const account = await this.accountService.getAccount(id);
      res.status(200).json({
        success: true,
        data: account,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : "Account not found",
      });
    }
  };

  createAccount = async (req: Request, res: Response) => {
    try {
      // Use the authenticated user's ID
      const accountData = {
        ...req.body,
        userId: req.user?.id || req.body.userId, // Use authenticated user ID, fallback to body if needed
      };

      const account = await this.accountService.createAccount(accountData);
      res.status(201).json({
        success: true,
        data: account,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Bad request",
      });
    }
  };

  updateAccount = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const updateData = req.body;
      const account = await this.accountService.updateAccount(id, updateData);
      res.status(200).json({
        success: true,
        data: account,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Bad request",
      });
    }
  };
}
