import { createWorker } from "tesseract.js";
import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { PrismaClient } from "../../generated/prisma";

export interface ProcessedReceiptData {
  merchant: string;
  totalAmount: number;
  date: Date;
  items?: Array<{
    name: string;
    price: number;
    quantity?: number;
  }>;
  tax?: number;
  tip?: number;
  category?: string;
  expenseType?: string;
}

export interface CreateReceiptData {
  userId: string;
  imageUrl: string;
}

export class ReceiptService {
  private openai: OpenAI;

  constructor(private readonly prisma: PrismaClient) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async createReceipt(data: CreateReceiptData) {
    try {
      const receipt = await this.prisma.receipt.create({
        data: {
          userId: data.userId,
          imageUrl: data.imageUrl,
          status: "PENDING",
        },
      });

      // Process the receipt asynchronously
      this.processReceiptAsync(receipt.id);

      return receipt;
    } catch (error) {
      throw new Error(`Failed to create receipt: ${error}`);
    }
  }

  async getReceiptsByUserId(userId: string) {
    try {
      const receipts = await this.prisma.receipt.findMany({
        where: { userId },
        include: {
          expenses: {
            include: {
              expenseType: {
                include: {
                  category: true,
                },
              },
              bankAccount: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return receipts;
    } catch (error) {
      throw new Error(`Failed to get receipts: ${error}`);
    }
  }

  async getReceiptById(id: string) {
    try {
      const receipt = await this.prisma.receipt.findUnique({
        where: { id },
        include: {
          expenses: {
            include: {
              expenseType: {
                include: {
                  category: true,
                },
              },
              bankAccount: true,
            },
          },
        },
      });

      return receipt;
    } catch (error) {
      throw new Error(`Failed to get receipt: ${error}`);
    }
  }

  async deleteReceipt(id: string) {
    try {
      const receipt = await this.prisma.receipt.findUnique({
        where: { id },
        include: { expenses: true },
      });

      if (!receipt) {
        throw new Error("Receipt not found");
      }

      // Delete associated expenses
      for (const expense of receipt.expenses) {
        await this.prisma.expense.delete({ where: { id: expense.id } });
      }

      // Delete the receipt
      await this.prisma.receipt.delete({ where: { id } });

      // Delete the image file if it exists locally
      if (receipt.imageUrl.startsWith("/uploads/")) {
        const filePath = path.join(process.cwd(), "public", receipt.imageUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete receipt: ${error}`);
    }
  }

  private async processReceiptAsync(receiptId: string) {
    try {
      const receipt = await this.prisma.receipt.findUnique({
        where: { id: receiptId },
      });

      if (!receipt) {
        throw new Error("Receipt not found");
      }

      // Update status to processing
      await this.prisma.receipt.update({
        where: { id: receiptId },
        data: { status: "PROCESSING" },
      });

      // Extract text using OCR
      const ocrText = await this.extractTextFromImage(receipt.imageUrl);

      // Update receipt with OCR text
      await this.prisma.receipt.update({
        where: { id: receiptId },
        data: { originalText: ocrText },
      });

      // Process with AI
      const processedData = await this.processWithAI(ocrText);

      // Update receipt with processed data
      await this.prisma.receipt.update({
        where: { id: receiptId },
        data: {
          processedData: processedData as any,
          status: "PROCESSED",
        },
      });
    } catch (error) {
      console.error(`Error processing receipt ${receiptId}:`, error);

      // Update status to failed
      await this.prisma.receipt.update({
        where: { id: receiptId },
        data: { status: "FAILED" },
      });
    }
  }

  private async extractTextFromImage(imageUrl: string): Promise<string> {
    try {
      const worker = await createWorker("eng");

      // Handle both local and remote URLs
      let imagePath = imageUrl;
      if (imageUrl.startsWith("/uploads/")) {
        imagePath = path.join(process.cwd(), "public", imageUrl);
      }

      const {
        data: { text },
      } = await worker.recognize(imagePath);
      await worker.terminate();

      return text;
    } catch (error) {
      throw new Error(`OCR extraction failed: ${error}`);
    }
  }

  private async processWithAI(ocrText: string): Promise<ProcessedReceiptData> {
    try {
      const prompt = `
        Analyze this receipt text and extract the following information in JSON format:
        - merchant: The name of the store/merchant
        - totalAmount: The total amount paid (number)
        - date: The date of the receipt (ISO date string)
        - items: Array of items with name, price, and quantity (if available)
        - tax: Tax amount if present (number)
        - tip: Tip amount if present (number)
        - category: Suggested expense category (e.g., "Food & Dining", "Transportation", "Shopping", "Utilities", "Entertainment", "Healthcare", "Education", "Other")
        - expenseType: Suggested expense type within the category

        Receipt text:
        ${ocrText}

        Return only valid JSON without any additional text.
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are a receipt analysis expert. Extract structured data from receipt text and return it as JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.1,
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error("No response from AI");
      }

      const processedData = JSON.parse(responseText);
      return {
        ...processedData,
        date: new Date(processedData.date),
      };
    } catch (error) {
      throw new Error(`AI processing failed: ${error}`);
    }
  }

  async createExpenseFromReceipt(
    receiptId: string,
    userId: string,
    bankAccountId: string,
    expenseTypeId: string,
    amount?: number
  ) {
    try {
      const receipt = await this.prisma.receipt.findUnique({
        where: { id: receiptId },
      });

      if (!receipt || receipt.status !== "PROCESSED") {
        throw new Error("Receipt not found or not processed");
      }

      const processedData =
        receipt.processedData as unknown as ProcessedReceiptData;
      const expenseAmount = amount || processedData.totalAmount;

      const expense = await this.prisma.expense.create({
        data: {
          userId,
          bankAccountId,
          expenseTypeId,
          amount: new (require("@prisma/client").Decimal)(expenseAmount),
          note: `Receipt from ${processedData.merchant}`,
          date: processedData.date,
          receiptId,
        },
        include: {
          expenseType: {
            include: {
              category: true,
            },
          },
          bankAccount: true,
          receipt: true,
        },
      });

      return expense;
    } catch (error) {
      throw new Error(`Failed to create expense from receipt: ${error}`);
    }
  }

  async getReceiptStats(userId: string) {
    try {
      const receipts = await this.prisma.receipt.findMany({
        where: { userId },
        include: {
          expenses: true,
        },
      });

      const stats = {
        total: receipts.length,
        processed: receipts.filter((r: any) => r.status === "PROCESSED").length,
        pending: receipts.filter((r: any) => r.status === "PENDING").length,
        failed: receipts.filter((r: any) => r.status === "FAILED").length,
        totalAmount: 0,
      };

      receipts.forEach((receipt: any) => {
        receipt.expenses.forEach((expense: any) => {
          stats.totalAmount += Number(expense.amount);
        });
      });

      return stats;
    } catch (error) {
      throw new Error(`Failed to get receipt stats: ${error}`);
    }
  }
}
