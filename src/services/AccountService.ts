import { PrismaClient } from "@prisma/client";
import { BankAccount } from "../../generated/prisma";

export class AccountService {
  constructor(private readonly prisma: PrismaClient) {}

  async getAccount(id: string) {
    try {
      const account = await this.prisma.bankAccount.findUnique({
        where: {
          id,
        },
      });
      return account;
    } catch (error) {
      throw new Error("Failed to get account");
    }
  }

  async getAccountsByUserId(userId: string) {
    try {
      const accounts = await this.prisma.bankAccount.findMany({
        where: {
          userId,
        },
      });
      return accounts;
    } catch (error) {
      throw new Error("Failed to get accounts");
    }
  }

  async createAccount(account: BankAccount) {
    try {
      const newAccount = await this.prisma.bankAccount.create({
        data: account,
      });
      return newAccount;
    } catch (error) {
      throw new Error("Failed to create account");
    }
  }
}
