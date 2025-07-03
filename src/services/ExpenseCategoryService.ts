import { ExpenseCategory, PrismaClient } from "../../generated/prisma";

export class ExpenseCategoryService {
  constructor(private readonly prisma: PrismaClient) {}

  async getAllCategories() {
    try {
      const categories = await this.prisma.expenseCategory.findMany({
        orderBy: {
          name: "asc",
        },
      });
      return categories;
    } catch (error) {
      console.log(error);
      throw new Error("Failed to get expense categories");
    }
  }

  async getCategoryById(id: string) {
    try {
      const category = await this.prisma.expenseCategory.findUnique({
        where: {
          id,
        },
      });
      return category;
    } catch (error) {
      console.log(error);
      throw new Error("Failed to get expense category");
    }
  }

  async createCategory(
    category: Omit<ExpenseCategory, "id" | "createdAt" | "updatedAt">
  ) {
    try {
      const newCategory = await this.prisma.expenseCategory.create({
        data: category,
      });
      return newCategory;
    } catch (error) {
      console.log(error);
      throw new Error("Failed to create expense category");
    }
  }

  async updateCategory(id: string, updateData: Partial<ExpenseCategory>) {
    try {
      const updatedCategory = await this.prisma.expenseCategory.update({
        where: {
          id,
        },
        data: updateData,
      });
      return updatedCategory;
    } catch (error) {
      console.log(error);
      throw new Error("Failed to update expense category");
    }
  }

  async deleteCategory(id: string) {
    try {
      const deletedCategory = await this.prisma.expenseCategory.delete({
        where: {
          id,
        },
      });
      return deletedCategory;
    } catch (error) {
      console.log(error);
      throw new Error("Failed to delete expense category");
    }
  }
}
