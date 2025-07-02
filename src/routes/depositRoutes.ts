import { Router } from "express";
import DepositController from "../controllers/DepositController";

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
   */
  router.post("/", depositController.createDeposit);

  /**
   * @swagger
   * /deposits:
   *   get:
   *     summary: Get all deposits for a user
   *     tags: [Deposits]
   */
  router.get("/", depositController.getDepositsByUserId);

  /**
   * @swagger
   * /deposits/{id}:
   *   get:
   *     summary: Get deposit by ID
   *     tags: [Deposits]
   */
  router.get("/:id", depositController.getDepositById);

  /**
   * @swagger
   * /deposits/{id}:
   *   put:
   *     summary: Update a deposit
   *     tags: [Deposits]
   */
  router.put("/:id", depositController.updateDeposit);

  /**
   * @swagger
   * /deposits/{id}:
   *   delete:
   *     summary: Delete a deposit
   *     tags: [Deposits]
   */
  router.delete("/:id", depositController.deleteDeposit);

  /**
   * @swagger
   * /deposits/types/all:
   *   get:
   *     summary: Get all deposit types
   *     tags: [Deposits]
   */
  router.get("/types/all", depositController.getDepositTypes);

  /**
   * @swagger
   * /deposits/types:
   *   post:
   *     summary: Create a new deposit type
   *     tags: [Deposits]
   */
  router.post("/types", depositController.createDepositType);

  return router;
}
