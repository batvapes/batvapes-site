// test-prisma.js
require("dotenv/config");            // laad .env

const { PrismaClient } = require("@prisma/client");

// Geef de DATABASE_URL expliciet door aan PrismaClient
const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function main() {
  const customers = await prisma.customer.findMany();
  console.log("Customers in DB:", customers);
}

main()
  .catch((e) => {
    console.error("Prisma error:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
