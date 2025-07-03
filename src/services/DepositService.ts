import { Decimal } from "@prisma/client/runtime/library";
import { PrismaClient } from "../../generated/prisma";

export interface CreateDepositData {
  userId: string;
  bankAccountId: string;
  depositTypeId: string;
  amount: number;
  note?: string;
  date?: Date;
}

export interface UpdateDepositData {
  depositTypeId?: string;
  amount?: number;
  note?: string;
  date?: Date;
}

export class DepositService {
  constructor(private readonly prisma: PrismaClient) {}

  async createDeposit(data: CreateDepositData) {
    try {
      const deposit = await this.prisma.deposit.create({
        data: {
          userId: data.userId,
          bankAccountId: data.bankAccountId,
          depositTypeId: data.depositTypeId,
          amount: new Decimal(data.amount),
          note: data.note,
          date: data.date || new Date(),
        },
        include: {
          depositType: true,
          bankAccount: true,
        },
      });

      // Update bank account balance
      await this.updateBankAccountBalance(data.bankAccountId, data.amount);

      return deposit;
    } catch (error) {
      throw new Error(`Failed to create deposit: ${error}`);
    }
  }

  async getDepositsByUserId(
    userId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      bankAccountId?: string;
      depositTypeId?: string;
    },
    includeFields?: string[]
  ) {
    try {
      const where: any = { userId };

      if (filters?.startDate || filters?.endDate) {
        where.date = {};
        if (filters.startDate) where.date.gte = filters.startDate;
        if (filters.endDate) where.date.lte = filters.endDate;
      }

      if (filters?.bankAccountId) where.bankAccountId = filters.bankAccountId;
      if (filters?.depositTypeId) where.depositTypeId = filters.depositTypeId;

      // Build include object dynamically
      let include: any = undefined;
      if (Array.isArray(includeFields) && includeFields.length > 0) {
        include = {};
        if (includeFields.includes("depositType")) include.depositType = true;
        if (includeFields.includes("bankAccount")) include.bankAccount = true;
      } else {
        include = {
          depositType: true,
          bankAccount: true,
        };
      }

      const deposits = await this.prisma.deposit.findMany({
        where,
        include,
        orderBy: { date: "desc" },
      });

      return deposits;
    } catch (error) {
      throw new Error(`Failed to get deposits: ${error}`);
    }
  }

  async getDepositById(id: string) {
    try {
      const deposit = await this.prisma.deposit.findUnique({
        where: { id },
        include: {
          depositType: true,
          bankAccount: true,
        },
      });

      return deposit;
    } catch (error) {
      throw new Error(`Failed to get deposit: ${error}`);
    }
  }

  async updateDeposit(id: string, data: UpdateDepositData) {
    try {
      const oldDeposit = await this.prisma.deposit.findUnique({
        where: { id },
        select: { amount: true, bankAccountId: true },
      });

      if (!oldDeposit) {
        throw new Error("Deposit not found");
      }

      const updateData: any = {};
      if (data.depositTypeId) updateData.depositTypeId = data.depositTypeId;
      if (data.amount !== undefined)
        updateData.amount = new Decimal(data.amount);
      if (data.note !== undefined) updateData.note = data.note;
      if (data.date) updateData.date = data.date;

      const deposit = await this.prisma.deposit.update({
        where: { id },
        data: updateData,
        include: {
          depositType: true,
          bankAccount: true,
        },
      });

      // Update bank account balance if amount changed
      if (data.amount !== undefined) {
        const balanceChange = data.amount - Number(oldDeposit.amount);
        await this.updateBankAccountBalance(
          oldDeposit.bankAccountId,
          balanceChange
        );
      }

      return deposit;
    } catch (error) {
      throw new Error(`Failed to update deposit: ${error}`);
    }
  }

  async deleteDeposit(id: string) {
    try {
      const deposit = await this.prisma.deposit.findUnique({
        where: { id },
        select: { amount: true, bankAccountId: true },
      });

      if (!deposit) {
        throw new Error("Deposit not found");
      }

      await this.prisma.deposit.delete({ where: { id } });

      // Restore bank account balance
      await this.updateBankAccountBalance(
        deposit.bankAccountId,
        -Number(deposit.amount)
      );

      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete deposit: ${error}`);
    }
  }

  async getDepositSummary(userId: string, startDate: Date, endDate: Date) {
    try {
      const deposits = await this.prisma.deposit.findMany({
        where: {
          userId,
          date: { gte: startDate, lte: endDate },
        },
        include: {
          depositType: true,
        },
      });

      const summary = {
        totalAmount: 0,
        count: deposits.length,
        byType: {} as Record<string, { amount: number; count: number }>,
      };

      deposits.forEach((deposit: any) => {
        const amount = Number(deposit.amount);
        summary.totalAmount += amount;

        const typeName = deposit.depositType.name;
        if (!summary.byType[typeName]) {
          summary.byType[typeName] = { amount: 0, count: 0 };
        }
        summary.byType[typeName].amount += amount;
        summary.byType[typeName].count += 1;
      });

      return summary;
    } catch (error) {
      throw new Error(`Failed to get deposit summary: ${error}`);
    }
  }

  async getDepositTypes() {
    try {
      const depositTypes = await this.prisma.depositType.findMany({
        orderBy: { name: "asc" },
      });

      return depositTypes;
    } catch (error) {
      throw new Error(`Failed to get deposit types: ${error}`);
    }
  }

  async createDepositType(
    name: string,
    description?: string,
    icon?: string,
    color?: string
  ) {
    try {
      const depositType = await this.prisma.depositType.create({
        data: {
          name,
          description,
          icon,
          color,
        },
      });

      return depositType;
    } catch (error) {
      throw new Error(`Failed to create deposit type: ${error}`);
    }
  }

  private async updateBankAccountBalance(
    bankAccountId: string,
    amountChange: number
  ) {
    try {
      await this.prisma.bankAccount.update({
        where: { id: bankAccountId },
        data: {
          balance: {
            increment: amountChange,
          },
        },
      });
    } catch (error) {
      throw new Error(`Failed to update bank account balance: ${error}`);
    }
  }
}
