import { Router } from "express";
import AccountController from "../controllers/AccountController";

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
   *               $ref: "#/components/schemas/BankAccountsResponse"
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       400:
   *         description: Bad request
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  router.get("/", accountController.getAccountsByUserId);

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
   *               $ref: "#/components/schemas/BankAccountResponse"
   *       404:
   *         description: Account not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  router.get("/:id", accountController.getAccountById);

  return router;
}
