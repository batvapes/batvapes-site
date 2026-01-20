import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { normalizeCategory } from "@/lib/productCategories";

async function requireAdmin() {
  const cookieStore = await cookies();
  const adminId = cookieStore.get("adminId")?.value;
  return adminId ? adminId : null;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      category: true,
      priceCents: true,
      stockQty: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ products }, { status: 200 });
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const name = String(body?.name ?? "").trim();
    const category = normalizeCategory(body?.category);

    const priceCents = Number(body?.priceCents);
    const stockQty = Number(body?.stockQty);
    const isActive = body?.isActive === false ? false : true;

    if (!name) return NextResponse.json({ error: "Naam is verplicht" }, { status: 400 });
    if (!Number.isFinite(priceCents) || priceCents < 0)
      return NextResponse.json({ error: "Ongeldige prijs" }, { status: 400 });
    if (!Number.isFinite(stockQty) || stockQty < 0)
      return NextResponse.json({ error: "Ongeldige stock" }, { status: 400 });

    const product = await prisma.product.create({
      data: { name, category, priceCents, stockQty, isActive },
      select: {
        id: true,
        name: true,
        category: true,
        priceCents: true,
        stockQty: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/admin/products error:", e);
    return NextResponse.json({ error: "Toevoegen mislukt" }, { status: 500 });
  }
}
