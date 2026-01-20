/* create-admin.cjs
   Gebruik:
   node create-admin.cjs <username> <password>

   Voorbeeld:
   node create-admin.cjs admin admin1234
*/

require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const username = (process.argv[2] || "").trim();
  const password = process.argv[3] || "";

  if (!username || !password) {
    console.log("❌ Gebruik: node create-admin.cjs <username> <password>");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Jouw API gebruikt prisma.admin.findUnique({ where: { username } })
  // => username is uniek in schema, dus upsert werkt perfect.
  const admin = await prisma.admin.upsert({
    where: { username },
    update: { passwordHash },
    create: { username, passwordHash },
    select: { id: true, username: true },
  });

  console.log("✅ Admin klaar:", admin);
  console.log("✅ Login met:");
  console.log("   username:", username);
  console.log("   password:", password);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
