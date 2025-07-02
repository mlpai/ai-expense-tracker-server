import swaggerJSDoc from "swagger-jsdoc";

// Add prefix v1 to all routes
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Expense Tracker API",
      version: "1.0.0",
      description: "API documentation for the Expense Tracker app",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "API server",
      },
    ],
    components: {
      schemas: {
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "User ID",
            },
            email: {
              type: "string",
              format: "email",
              description: "User email address",
            },
            passwordHash: {
              type: "string",
              description: "Hashed password",
            },
            name: {
              type: "string",
              description: "User's full name",
            },
            bankAccounts: {
              type: "array",
              items: {
                $ref: "#/components/schemas/BankAccount",
              },
              description: "User's bank accounts",
            },
            expenses: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Expense",
              },
              description: "User's expenses",
            },
            budgets: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Budget",
              },
              description: "User's budgets",
            },
            aiSuggestions: {
              type: "array",
              items: {
                $ref: "#/components/schemas/AiSuggestion",
              },
              description: "AI suggestions for the user",
            },
            monthlyReports: {
              type: "array",
              items: {
                $ref: "#/components/schemas/MonthlyReport",
              },
              description: "User's monthly reports",
            },
          },
          required: ["id", "email", "passwordHash", "name"],
        },
        BankAccount: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Bank account ID",
            },
            accountNumber: {
              type: "string",
              description: "Bank account number",
            },
            bankName: {
              type: "string",
              description: "Name of the bank",
            },
            balance: {
              type: "number",
              description: "Current balance",
            },
            userId: {
              type: "string",
              description: "User ID who owns this account",
            },
          },
          required: ["id", "accountNumber", "bankName", "balance", "userId"],
        },
        Expense: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Expense ID",
            },
            amount: {
              type: "number",
              description: "Expense amount",
            },
            description: {
              type: "string",
              description: "Expense description",
            },
            date: {
              type: "string",
              format: "date",
              description: "Date of the expense",
            },
            category: {
              type: "string",
              description: "Expense category",
            },
            userId: {
              type: "string",
              description: "User ID who made this expense",
            },
          },
          required: [
            "id",
            "amount",
            "description",
            "date",
            "category",
            "userId",
          ],
        },
        Budget: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Budget ID",
            },
            amount: {
              type: "number",
              description: "Budget amount",
            },
            category: {
              type: "string",
              description: "Budget category",
            },
            period: {
              type: "string",
              description: "Budget period (monthly, yearly, etc.)",
            },
            userId: {
              type: "string",
              description: "User ID who owns this budget",
            },
          },
          required: ["id", "amount", "category", "period", "userId"],
        },
        AiSuggestion: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "AI suggestion ID",
            },
            suggestion: {
              type: "string",
              description: "The AI suggestion text",
            },
            type: {
              type: "string",
              description: "Type of suggestion",
            },
            userId: {
              type: "string",
              description: "User ID who received this suggestion",
            },
          },
          required: ["id", "suggestion", "type", "userId"],
        },
        MonthlyReport: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Monthly report ID",
            },
            month: {
              type: "string",
              description: "Report month",
            },
            year: {
              type: "number",
              description: "Report year",
            },
            totalExpenses: {
              type: "number",
              description: "Total expenses for the month",
            },
            totalIncome: {
              type: "number",
              description: "Total income for the month",
            },
            userId: {
              type: "string",
              description: "User ID who owns this report",
            },
          },
          required: [
            "id",
            "month",
            "year",
            "totalExpenses",
            "totalIncome",
            "userId",
          ],
        },
        Error: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "Error message",
            },
            status: {
              type: "number",
              description: "HTTP status code",
            },
          },
          required: ["message", "status"],
        },
        UserResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              description: "Indicates if the request was successful",
            },
            data: {
              $ref: "#/components/schemas/User",
              description: "User data",
            },
          },
          required: ["success", "data"],
        },
        UsersResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              description: "Indicates if the request was successful",
            },
            data: {
              type: "array",
              items: {
                $ref: "#/components/schemas/User",
              },
              description: "Array of users",
            },
          },
          required: ["success", "data"],
        },
        LoginResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              description: "Indicates if the login was successful",
            },
            data: {
              type: "object",
              properties: {
                user: {
                  $ref: "#/components/schemas/User",
                },
                token: {
                  type: "string",
                  description: "JWT authentication token",
                },
              },
              required: ["user", "token"],
            },
          },
          required: ["success", "data"],
        },
        BankAccountResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              description: "Indicates if the request was successful",
            },
            data: {
              $ref: "#/components/schemas/BankAccount",
              description: "Bank account data",
            },
          },
          required: ["success", "data"],
        },
        BankAccountsResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              description: "Indicates if the request was successful",
            },
            data: {
              type: "array",
              items: {
                $ref: "#/components/schemas/BankAccount",
              },
              description: "Array of bank accounts",
            },
          },
          required: ["success", "data"],
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/routes/*.ts", "./src/routes/**/*.ts"],
  basePath: "/api/v1",
};

const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;
