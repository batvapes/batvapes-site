import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();

    const name = String(body.name || "").trim();
    const priceCents = Number(body.priceCents);
    const stockQty = Number(body.stockQty);
    const isActive = body.isActive === false ? false : true;

    if (!name) return new NextResponse("Naam is verplicht", { status: 400 });
    if (!Number.isFinite(priceCents) || priceCents < 0) {
      return new NextResponse("Prijs ongeldig", { status: 400 });
    }
    if (!Number.isFinite(stockQty) || stockQty < 0) {
      return new NextResponse("Stock ongeldig", { status: 400 });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { name, priceCents, stockQty, isActive },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return new NextResponse(err?.message || "Update failed", { status: 400 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return new NextResponse(err?.message || "Delete failed", { status: 400 });
  }
}
