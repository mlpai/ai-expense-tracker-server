import { Router } from "express";
import ReceiptController from "../controllers/ReceiptController";

export default function createReceiptRoutes(
  receiptController: ReceiptController
) {
  const router = Router();

  /**
   * @swagger
   * /receipts:
   *   post:
   *     summary: Upload and process a receipt
   *     tags: [Receipts]
   */
  router.post("/", receiptController.createReceipt);

  /**
   * @swagger
   * /receipts:
   *   get:
   *     summary: Get all receipts for a user
   *     tags: [Receipts]
   */
  router.get("/", receiptController.getReceiptsByUserId);

  /**
   * @swagger
   * /receipts/{id}:
   *   get:
   *     summary: Get receipt by ID
   *     tags: [Receipts]
   */
  router.get("/:id", receiptController.getReceiptById);

  /**
   * @swagger
   * /receipts/{id}:
   *   delete:
   *     summary: Delete a receipt
   *     tags: [Receipts]
   */
  router.delete("/:id", receiptController.deleteReceipt);

  /**
   * @swagger
   * /receipts/expense:
   *   post:
   *     summary: Create expense from receipt
   *     tags: [Receipts]
   */
  router.post("/expense", receiptController.createExpenseFromReceipt);

  /**
   * @swagger
   * /receipts/stats/all:
   *   get:
   *     summary: Get receipt statistics
   *     tags: [Receipts]
   */
  router.get("/stats/all", receiptController.getReceiptStats);

  return router;
}
