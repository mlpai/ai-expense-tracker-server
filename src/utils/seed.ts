import { prisma } from "./prisma";

async function seed() {
  try {
    console.log("Starting database seeding...");

    // Create default expense categories
    const categories = [
      {
        name: "Food & Dining",
        description: "Restaurants, groceries, and food delivery",
        icon: "🍽️",
        color: "#FF6B6B",
      },
      {
        name: "Transportation",
        description: "Gas, public transport, rideshare",
        icon: "🚗",
        color: "#4ECDC4",
      },
      {
        name: "Shopping",
        description: "Clothing, electronics, general shopping",
        icon: "🛍️",
        color: "#45B7D1",
      },
      {
        name: "Utilities",
        description: "Electricity, water, internet, phone",
        icon: "⚡",
        color: "#96CEB4",
      },
      {
        name: "Entertainment",
        description: "Movies, games, hobbies, subscriptions",
        icon: "🎬",
        color: "#FFEAA7",
      },
      {
        name: "Healthcare",
        description: "Medical expenses, insurance, prescriptions",
        icon: "🏥",
        color: "#DDA0DD",
      },
      {
        name: "Education",
        description: "Tuition, books, courses, training",
        icon: "📚",
        color: "#98D8C8",
      },
      {
        name: "Housing",
        description: "Rent, mortgage, maintenance",
        icon: "🏠",
        color: "#F7DC6F",
      },
      {
        name: "Other",
        description: "Miscellaneous expenses",
        icon: "📝",
        color: "#BB8FCE",
        isDefault: true,
      },
    ];

    for (const category of categories) {
      await prisma.expenseCategory.upsert({
        where: { name: category.name },
        update: {},
        create: category,
      });
    }

    // Get the default category for expense types
    const defaultCategory = await prisma.expenseCategory.findFirst({
      where: { name: "Other" },
    });

    if (!defaultCategory) {
      throw new Error("Default category not found");
    }

    // Create default deposit types
    const depositTypes = [
      {
        name: "Salary",
        description: "Regular employment income",
        icon: "💰",
        color: "#2ECC71",
      },
      {
        name: "Freelance",
        description: "Freelance or contract work",
        icon: "💼",
        color: "#3498DB",
      },
      {
        name: "Investment",
        description: "Investment returns, dividends",
        icon: "📈",
        color: "#F39C12",
      },
      {
        name: "Interest",
        description: "Bank interest, savings",
        icon: "🏦",
        color: "#9B59B6",
      },
      {
        name: "Gift",
        description: "Gifts and donations",
        icon: "🎁",
        color: "#E74C3C",
      },
      {
        name: "Refund",
        description: "Returns and refunds",
        icon: "↩️",
        color: "#1ABC9C",
      },
      {
        name: "Other",
        description: "Other income sources",
        icon: "📝",
        color: "#95A5A6",
      },
    ];

    for (const depositType of depositTypes) {
      await prisma.depositType.upsert({
        where: { name: depositType.name },
        update: {},
        create: depositType,
      });
    }

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seed()
    .then(() => {
      console.log("Seeding completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    });
}

export default seed;
