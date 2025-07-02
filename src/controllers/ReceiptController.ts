import { Request, Response } from "express";
import { ReceiptService } from "../services/ReceiptService";

export default class ReceiptController {
  constructor(private readonly receiptService: ReceiptService) {}

  createReceipt = async (req: Request, res: Response) => {
    try {
      // Assume file upload middleware sets req.file.path or req.body.imageUrl
      const imageUrl = req.file?.path || req.body.imageUrl;
      const receipt = await this.receiptService.createReceipt({
        userId: req.body.userId,
        imageUrl,
      });
      res.status(201).json({ success: true, data: receipt });
    } catch (error) {
      res
        .status(400)
        .json({ success: false, message: (error as Error).message });
    }
  };

  getReceiptsByUserId = async (req: Request, res: Response) => {
    try {
      const { userId } = req.query;
      const receipts = await this.receiptService.getReceiptsByUserId(
        userId as string
      );
      res.status(200).json({ success: true, data: receipts });
    } catch (error) {
      res
        .status(400)
        .json({ success: false, message: (error as Error).message });
    }
  };

  getReceiptById = async (req: Request, res: Response) => {
    try {
      const receipt = await this.receiptService.getReceiptById(req.params.id);
      res.status(200).json({ success: true, data: receipt });
    } catch (error) {
      res
        .status(404)
        .json({ success: false, message: (error as Error).message });
    }
  };

  deleteReceipt = async (req: Request, res: Response) => {
    try {
      const result = await this.receiptService.deleteReceipt(req.params.id);
      res.status(200).json({ success: true, data: null });
    } catch (error) {
      res
        .status(400)
        .json({ success: false, message: (error as Error).message });
    }
  };

  createExpenseFromReceipt = async (req: Request, res: Response) => {
    try {
      const { receiptId, userId, bankAccountId, expenseTypeId, amount } =
        req.body;
      const expense = await this.receiptService.createExpenseFromReceipt(
        receiptId,
        userId,
        bankAccountId,
        expenseTypeId,
        amount
      );
      res.status(201).json({ success: true, data: expense });
    } catch (error) {
      res
        .status(400)
        .json({ success: false, message: (error as Error).message });
    }
  };

  getReceiptStats = async (req: Request, res: Response) => {
    try {
      const { userId } = req.query;
      const stats = await this.receiptService.getReceiptStats(userId as string);
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      res
        .status(400)
        .json({ success: false, message: (error as Error).message });
    }
  };
}
