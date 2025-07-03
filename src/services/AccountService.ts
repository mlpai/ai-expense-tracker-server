import { BankAccount, PrismaClient } from "../../generated/prisma";

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
      console.log(newAccount);
      return newAccount;
    } catch (error) {
      console.log(error);
      throw new Error("Failed to create account");
    }
  }

  async updateAccount(id: string, updateData: Partial<BankAccount>) {
    try {
      const updatedAccount = await this.prisma.bankAccount.update({
        where: {
          id,
        },
        data: updateData,
      });
      return updatedAccount;
    } catch (error) {
      console.log(error);
      throw new Error("Failed to update account");
    }
  }
}
