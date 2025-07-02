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

    // Create default expense types
    const expenseTypes = [
      {
        name: "Restaurant",
        description: "Dining out",
        categoryId: defaultCategory.id,
      },
      {
        name: "Groceries",
        description: "Food shopping",
        categoryId: defaultCategory.id,
      },
      {
        name: "Gas",
        description: "Fuel for vehicles",
        categoryId: defaultCategory.id,
      },
      {
        name: "Public Transport",
        description: "Bus, train, subway",
        categoryId: defaultCategory.id,
      },
      {
        name: "Clothing",
        description: "Apparel and accessories",
        categoryId: defaultCategory.id,
      },
      {
        name: "Electronics",
        description: "Computers, phones, gadgets",
        categoryId: defaultCategory.id,
      },
      {
        name: "Electricity",
        description: "Power bills",
        categoryId: defaultCategory.id,
      },
      {
        name: "Internet",
        description: "Internet service",
        categoryId: defaultCategory.id,
      },
      {
        name: "Phone",
        description: "Mobile and landline",
        categoryId: defaultCategory.id,
      },
      {
        name: "Movies",
        description: "Cinema and streaming",
        categoryId: defaultCategory.id,
      },
      {
        name: "Gym",
        description: "Fitness and sports",
        categoryId: defaultCategory.id,
      },
      {
        name: "Medical",
        description: "Healthcare expenses",
        categoryId: defaultCategory.id,
      },
      {
        name: "Insurance",
        description: "Health, auto, home insurance",
        categoryId: defaultCategory.id,
      },
      {
        name: "Rent",
        description: "Housing rent",
        categoryId: defaultCategory.id,
      },
      {
        name: "Mortgage",
        description: "Home loan payments",
        categoryId: defaultCategory.id,
      },
    ];

    for (const expenseType of expenseTypes) {
      await prisma.expenseType.upsert({
        where: { name: expenseType.name },
        update: {},
        create: expenseType,
      });
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
