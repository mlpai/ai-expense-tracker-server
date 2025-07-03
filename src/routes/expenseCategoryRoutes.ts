import { Router } from "express";
import ExpenseCategoryController from "../controllers/ExpenseCategoryController";
import { authenticateToken } from "../middlewares/auth";

export default function createExpenseCategoryRoutes(
  expenseCategoryController: ExpenseCategoryController
) {
  const router = Router();

  /**
   * @openapi
   * /api/v1/expense-categories:
   *   get:
   *     summary: Get all expense categories
   *     description: Returns all expense categories with their associated expense types
   *     tags:
   *       - Expense Categories
   *     responses:
   *       200:
   *         description: A list of expense categories
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
   *                         description: Category ID
   *                       name:
   *                         type: string
   *                         description: Category name
   *                       description:
   *                         type: string
   *                         description: Category description
   *                       icon:
   *                         type: string
   *                         description: Icon for UI display
   *                       color:
   *                         type: string
   *                         description: Color for UI display
   *                       isDefault:
   *                         type: boolean
   *                         description: Whether this is a default category
   *                       expenseTypes:
   *                         type: array
   *                         items:
   *                           type: object
   *                           properties:
   *                             id:
   *                               type: string
   *                             name:
   *                               type: string
   *                             description:
   *                               type: string
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
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 status:
   *                   type: number
   */
  router.get(
    "/",
    authenticateToken,
    expenseCategoryController.getAllCategories
  );

  /**
   * @openapi
   * /api/v1/expense-categories/{id}:
   *   get:
   *     summary: Get expense category by ID
   *     description: Returns a specific expense category by ID
   *     tags:
   *       - Expense Categories
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the expense category
   *     responses:
   *       200:
   *         description: An expense category
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                     name:
   *                       type: string
   *                     description:
   *                       type: string
   *                     icon:
   *                       type: string
   *                     color:
   *                       type: string
   *                     isDefault:
   *                       type: boolean
   *                     expenseTypes:
   *                       type: array
   *                       items:
   *                         type: object
   *       404:
   *         description: Category not found
   *       500:
   *         description: Internal server error
   */
  router.get(
    "/:id",
    authenticateToken,
    expenseCategoryController.getCategoryById
  );

  /**
   * @openapi
   * /api/v1/expense-categories:
   *   post:
   *     summary: Create a new expense category
   *     description: Creates a new expense category
   *     tags:
   *       - Expense Categories
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 required: true
   *               description:
   *                 type: string
   *               icon:
   *                 type: string
   *               color:
   *                 type: string
   *               isDefault:
   *                 type: boolean
   *     responses:
   *       201:
   *         description: Category created successfully
   *       400:
   *         description: Bad request
   *       500:
   *         description: Internal server error
   */
  router.post("/", authenticateToken, expenseCategoryController.createCategory);

  /**
   * @openapi
   * /api/v1/expense-categories/{id}:
   *   put:
   *     summary: Update an expense category
   *     description: Updates an existing expense category
   *     tags:
   *       - Expense Categories
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *               icon:
   *                 type: string
   *               color:
   *                 type: string
   *               isDefault:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Category updated successfully
   *       400:
   *         description: Bad request
   *       500:
   *         description: Internal server error
   */
  router.put(
    "/:id",
    authenticateToken,
    expenseCategoryController.updateCategory
  );

  /**
   * @openapi
   * /api/v1/expense-categories/{id}:
   *   delete:
   *     summary: Delete an expense category
   *     description: Deletes an expense category
   *     tags:
   *       - Expense Categories
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Category deleted successfully
   *       400:
   *         description: Bad request
   *       500:
   *         description: Internal server error
   */
  router.delete(
    "/:id",
    authenticateToken,
    expenseCategoryController.deleteCategory
  );

  return router;
}
