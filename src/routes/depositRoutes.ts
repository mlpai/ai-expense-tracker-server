import { Router } from "express";
import DepositController from "../controllers/DepositController";
import { authenticateToken } from "../middlewares/auth";

export default function createDepositRoutes(
  depositController: DepositController
) {
  const router = Router();

  /**
   * @swagger
   * /deposits:
   *   post:
   *     summary: Create a new deposit
   *     tags: [Deposits]
   *     security:
   *       - bearerAuth: []
   */
  router.post("/", authenticateToken, depositController.createDeposit);

  /**
   * @swagger
   * /deposits:
   *   get:
   *     summary: Get all deposits for a user
   *     tags: [Deposits]
   *     security:
   *       - bearerAuth: []
   */
  router.get("/", authenticateToken, depositController.getDepositsByUserId);

  /**
   * @swagger
   * /deposits/{id}:
   *   get:
   *     summary: Get deposit by ID
   *     tags: [Deposits]
   *     security:
   *       - bearerAuth: []
   */
  router.get("/:id", authenticateToken, depositController.getDepositById);

  /**
   * @swagger
   * /deposits/{id}:
   *   put:
   *     summary: Update a deposit
   *     tags: [Deposits]
   *     security:
   *       - bearerAuth: []
   */
  router.put("/:id", authenticateToken, depositController.updateDeposit);

  /**
   * @swagger
   * /deposits/{id}:
   *   delete:
   *     summary: Delete a deposit
   *     tags: [Deposits]
   *     security:
   *       - bearerAuth: []
   */
  router.delete("/:id", authenticateToken, depositController.deleteDeposit);

  /**
   * @swagger
   * /deposits/types/all:
   *   get:
   *     summary: Get all deposit types
   *     tags: [Deposits]
   *     security:
   *       - bearerAuth: []
   */
  router.get(
    "/types/all",
    authenticateToken,
    depositController.getDepositTypes
  );

  /**
   * @swagger
   * /deposits/types:
   *   post:
   *     summary: Create a new deposit type
   *     tags: [Deposits]
   *     security:
   *       - bearerAuth: []
   */
  router.post("/types", authenticateToken, depositController.createDepositType);

  return router;
}
