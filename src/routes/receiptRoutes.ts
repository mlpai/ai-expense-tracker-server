import { Router } from "express";
import ReceiptController from "../controllers/ReceiptController";
import { authenticateToken } from "../middlewares/auth";

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
   *     security:
   *       - bearerAuth: []
   */
  router.post("/", authenticateToken, receiptController.createReceipt);

  /**
   * @swagger
   * /receipts:
   *   get:
   *     summary: Get all receipts for a user
   *     tags: [Receipts]
   *     security:
   *       - bearerAuth: []
   */
  router.get("/", authenticateToken, receiptController.getReceiptsByUserId);

  /**
   * @swagger
   * /receipts/{id}:
   *   get:
   *     summary: Get receipt by ID
   *     tags: [Receipts]
   *     security:
   *       - bearerAuth: []
   */
  router.get("/:id", authenticateToken, receiptController.getReceiptById);

  /**
   * @swagger
   * /receipts/{id}:
   *   delete:
   *     summary: Delete a receipt
   *     tags: [Receipts]
   *     security:
   *       - bearerAuth: []
   */
  router.delete("/:id", authenticateToken, receiptController.deleteReceipt);

  /**
   * @swagger
   * /receipts/expense:
   *   post:
   *     summary: Create expense from receipt
   *     tags: [Receipts]
   *     security:
   *       - bearerAuth: []
   */
  router.post(
    "/expense",
    authenticateToken,
    receiptController.createExpenseFromReceipt
  );

  /**
   * @swagger
   * /receipts/stats/all:
   *   get:
   *     summary: Get receipt statistics
   *     tags: [Receipts]
   *     security:
   *       - bearerAuth: []
   */
  router.get(
    "/stats/all",
    authenticateToken,
    receiptController.getReceiptStats
  );

  return router;
}
