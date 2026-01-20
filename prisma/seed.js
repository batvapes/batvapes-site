const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  // Admin account
  const username = "Admin";
  const adminPassword = "Admin123!";

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.admin.upsert({
    where: { username },
    update: {
      passwordHash,
    },
    create: {
      username,
      passwordHash,
    },
  });

  // Voorbeeld product (optioneel)
  await prisma.product.upsert({
    where: { name: "Blueberry Watermelon / Strawberry Mango" },
    update: {
      priceCents: 2000,
      stockQty: 10,
      isActive: true,
      description: null,
    },
    create: {
      name: "Blueberry Watermelon / Strawberry Mango",
      priceCents: 2000,
      stockQty: 10,
      isActive: true,
      description: null,
    },
  });

  console.log("✅ Seed klaar");
  console.log("Admin login:");
  console.log("username:", username);
  console.log("password:", adminPassword);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
