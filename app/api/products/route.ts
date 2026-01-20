import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/products
 * - default: enkel actieve producten (voor klant)
 * - ?all=1: alle producten (voor admin)
 * - ?category=VAPES|KLEDIJ (optioneel)
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "1";
  const category = searchParams.get("category")?.toUpperCase();

  const where: any = all ? {} : { isActive: true };
  if (category === "VAPES" || category === "KLEDIJ") where.category = category;

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      priceCents: true,
      isActive: true,
      stockQty: true,
      description: true,
      category: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ products });
}
