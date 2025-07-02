import { Router } from "express";
import AccountController from "../controllers/AccountController";
import { authenticateToken } from "../middlewares/auth";

export default function createAccountRoutes(
  accountController: AccountController
) {
  const router = Router();

  /**
   * @openapi
   * /api/v1/accounts:
   *   get:
   *     summary: Get all accounts
   *     description: Returns all accounts for the authenticated user
   *     tags:
   *       - Accounts
   *     responses:
   *       200:
   *         description: A list of accounts
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   description: Indicates if the request was successful
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                         description: Bank account ID
   *                       accountNumber:
   *                         type: string
   *                         description: Bank account number
   *                       bankName:
   *                         type: string
   *                         description: Name of the bank
   *                       balance:
   *                         type: number
   *                         description: Current balance
   *                       userId:
   *                         type: string
   *                         description: User ID who owns this account
   *               required:
   *                 - success
   *                 - data
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   description: Error message
   *                 status:
   *                   type: number
   *                   description: HTTP status code
   *               required:
   *                 - message
   *                 - status
   *       400:
   *         description: Bad request
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   description: Error message
   *                 status:
   *                   type: number
   *                   description: HTTP status code
   *               required:
   *                 - message
   *                 - status
   */
  router.get("/", authenticateToken, accountController.getAccountsByUserId);

  /**
   * @openapi
   * /api/v1/accounts/{id}:
   *   get:
   *     summary: Get an account by ID
   *     description: Returns an account by ID
   *     tags:
   *       - Accounts
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the account
   *     responses:
   *       200:
   *         description: An account
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   description: Indicates if the request was successful
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                       description: Bank account ID
   *                     accountNumber:
   *                       type: string
   *                       description: Bank account number
   *                     bankName:
   *                       type: string
   *                       description: Name of the bank
   *                     balance:
   *                       type: number
   *                       description: Current balance
   *                     userId:
   *                       type: string
   *                       description: User ID who owns this account
   *               required:
   *                 - success
   *                 - data
   *       404:
   *         description: Account not found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   description: Error message
   *                 status:
   *                   type: number
   *                   description: HTTP status code
   *               required:
   *                 - message
   *                 - status
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   description: Error message
   *                 status:
   *                   type: number
   *                   description: HTTP status code
   *               required:
   *                 - message
   *                 - status
   */
  router.get("/:id", authenticateToken, accountController.getAccountById);

  /**
   * @openapi
   * /api/v1/accounts:
   *   post:
   *     summary: Create an account
   *     description: Creates a new account for the authenticated user
   *     tags:
   *       - Accounts
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: Account created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   description: Indicates if the request was successful
   *                 data:
   *                   type: object
   *               required:
   *                 - success
   *                 - data
   *       400:
   *         description: Bad request
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   description: Error message
   *                 status:
   *                   type: number
   *                   description: HTTP status code
   *               required:
   *                 - message
   *                 - status
   */
  router.post("/", authenticateToken, accountController.createAccount);

  return router;
}
