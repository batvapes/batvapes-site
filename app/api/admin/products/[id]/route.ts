import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { normalizeCategory } from "@/lib/productCategories";

async function requireAdmin() {
  const cookieStore = await cookies();
  const adminId = cookieStore.get("adminId")?.value;
  return adminId ? adminId : null;
}

export async function PATCH(req: Request, context: any) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const params = await context.params;
    const id = params.id as string;
    const body = await req.json();

    const patch: any = {};
    if (typeof body.stockQty !== "undefined") patch.stockQty = Number(body.stockQty);
    if (typeof body.isActive !== "undefined") patch.isActive = !!body.isActive;
    if (typeof body.category !== "undefined") patch.category = normalizeCategory(body.category);

    if (typeof patch.stockQty !== "undefined") {
      if (!Number.isFinite(patch.stockQty) || patch.stockQty < 0) {
        return NextResponse.json({ error: "Ongeldige stock" }, { status: 400 });
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: patch,
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

    return NextResponse.json({ product }, { status: 200 });
  } catch (e: any) {
    if (e?.code === "P2025") {
      return NextResponse.json({ error: "Product niet gevonden (id klopt niet)" }, { status: 404 });
    }
    console.error("PATCH /api/admin/products/[id] error:", e);
    return NextResponse.json({ error: "Opslaan mislukt" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, context: any) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const params = await context.params;
    const id = params.id as string;

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    if (e?.code === "P2025") {
      return NextResponse.json({ error: "Product niet gevonden (id klopt niet)" }, { status: 404 });
    }
    console.error("DELETE /api/admin/products/[id] error:", e);
    return NextResponse.json({ error: "Verwijderen mislukt" }, { status: 500 });
  }
}
