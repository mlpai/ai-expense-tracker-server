import { AccountService } from "../services/AccountService";
import { Request, Response } from "express";

export default class AccountController {
  constructor(private readonly accountService: AccountService) {}

  getAccountsByUserId = async (req: Request, res: Response) => {
    const userId = req.query.userId as string;
    const accounts = await this.accountService.getAccountsByUserId(userId);
    res.status(200).json(accounts);
  };

  getAccountById = async (req: Request, res: Response) => {
    const id = req.params.id;
    const account = await this.accountService.getAccount(id);
    res.status(200).json(account);
  };
}
