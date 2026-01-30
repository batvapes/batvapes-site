const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

function parseMinutes(raw) {
  const s = String(raw ?? "").trim();
  const m = s.match(/(\d+)/);
  if (!m) return null;
  return Number(m[1]);
}

function cleanName(s) {
  return String(s ?? "").trim();
}

async function upsertTravel(from, to, minutes) {
  await prisma.travelTime.upsert({
    where: { fromMunicipality_toMunicipality: { fromMunicipality: from, toMunicipality: to } },
    update: { minutes },
    create: { fromMunicipality: from, toMunicipality: to, minutes },
  });
}

async function importTravelTimes() {
  const filePath = path.join(process.cwd(), "prisma", "travel_times.txt");
  if (!fs.existsSync(filePath)) {
    console.log("ℹ️  prisma/travel_times.txt niet gevonden → travel times import overgeslagen");
    return;
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const municipalities = new Set();

  let imported = 0;
  for (const line of lines) {
    // verwacht: A;B;30min (maar tabs/spaties ok)
    const parts = line.split(";").map((p) => p.trim());
    if (parts.length < 3) continue;

    const from = cleanName(parts[0]);
    const to = cleanName(parts[1]);
    const minutes = parseMinutes(parts[2]);

    if (!from || !to || minutes === null) continue;

    municipalities.add(from);
    municipalities.add(to);

    // ✅ sla A→B op
    await upsertTravel(from, to, minutes);
    imported++;

    // ✅ en ook B→A (zodat je geen dubbele duo’s hoeft)
    if (from !== to) {
      await upsertTravel(to, from, minutes);
      imported++;
    }
  }

  // ✅ voeg A→A = 0 toe
  for (const m of municipalities) {
    await upsertTravel(m, m, 0);
  }

  console.log(`✅ TravelTimes geïmporteerd/upserted: ${imported} richtingen + ${municipalities.size} self-routes`);
}

async function main() {
  // ===== ADMIN =====
  const adminUsername = "batman";
  const adminPassword = "batman123";
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.admin.upsert({
    where: { username: adminUsername },
    update: { passwordHash: adminPasswordHash },
    create: { username: adminUsername, passwordHash: adminPasswordHash },
  });

  // ===== TEST CUSTOMER =====
  const customerSnapchat = "test";
  const customerPassword = "test123";
  const customerPasswordHash = await bcrypt.hash(customerPassword, 10);

  await prisma.customer.upsert({
    where: { snapchat: customerSnapchat },
    update: { passwordHash: customerPasswordHash, username: "Test Customer" },
    create: {
      snapchat: customerSnapchat,
      username: "Test Customer",
      passwordHash: customerPasswordHash,
    },
  });

  // ===== VOORBEELD PRODUCT =====
  const productName = "Blueberry Watermelon / Strawberry Mango";
  await prisma.product.upsert({
    where: { name: productName },
    update: {
      priceCents: 2000,
      stockQty: 10,
      isActive: true,
      description: null,
      category: "VAPES",
    },
    create: {
      name: productName,
      priceCents: 2000,
      stockQty: 10,
      isActive: true,
      description: null,
      category: "VAPES",
    },
  });

  // ===== TRAVEL TIMES IMPORT =====
  await importTravelTimes();

  console.log("✅ Seed klaar");
  console.log("Admin login:", adminUsername, "/", adminPassword);
  console.log("Customer login:", customerSnapchat, "/", customerPassword);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
