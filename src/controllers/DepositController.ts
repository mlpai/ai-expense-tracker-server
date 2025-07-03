import { Request, Response } from "express";
import { DepositService } from "../services/DepositService";

export default class DepositController {
  constructor(private readonly depositService: DepositService) {}

  createDeposit = async (req: Request, res: Response) => {
    try {
      const deposit = await this.depositService.createDeposit(req.body);
      res.status(201).json({ success: true, data: deposit });
    } catch (error) {
      res
        .status(400)
        .json({ success: false, message: (error as Error).message });
    }
  };

  getDepositsByUserId = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id || (req.query.userId as string);
      // Parse optional 'include' param as array
      let include: string[] | undefined = undefined;
      if (typeof req.query.include === "string") {
        include = req.query.include
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      // Parse startDate and endDate as Date objects if present
      const filters: any = { ...req.query };
      if (filters.startDate) filters.startDate = new Date(filters.startDate);
      if (filters.endDate) filters.endDate = new Date(filters.endDate);

      const deposits = await this.depositService.getDepositsByUserId(
        userId as string,
        filters,
        include
      );
      res.status(200).json({ success: true, data: deposits });
    } catch (error) {
      res
        .status(400)
        .json({ success: false, message: (error as Error).message });
    }
  };

  getDepositById = async (req: Request, res: Response) => {
    try {
      const deposit = await this.depositService.getDepositById(req.params.id);
      res.status(200).json({ success: true, data: deposit });
    } catch (error) {
      res
        .status(404)
        .json({ success: false, message: (error as Error).message });
    }
  };

  updateDeposit = async (req: Request, res: Response) => {
    try {
      const deposit = await this.depositService.updateDeposit(
        req.params.id,
        req.body
      );
      res.status(200).json({ success: true, data: deposit });
    } catch (error) {
      res
        .status(400)
        .json({ success: false, message: (error as Error).message });
    }
  };

  deleteDeposit = async (req: Request, res: Response) => {
    try {
      const result = await this.depositService.deleteDeposit(req.params.id);
      res.status(200).json({ success: true, data: null });
    } catch (error) {
      res
        .status(400)
        .json({ success: false, message: (error as Error).message });
    }
  };

  getDepositTypes = async (req: Request, res: Response) => {
    try {
      const types = await this.depositService.getDepositTypes();
      res.status(200).json({ success: true, data: types });
    } catch (error) {
      res
        .status(400)
        .json({ success: false, message: (error as Error).message });
    }
  };

  createDepositType = async (req: Request, res: Response) => {
    try {
      const { name, description, icon, color } = req.body;
      const type = await this.depositService.createDepositType(
        name,
        description,
        icon,
        color
      );
      res.status(201).json({ success: true, data: type });
    } catch (error) {
      res
        .status(400)
        .json({ success: false, message: (error as Error).message });
    }
  };
}
