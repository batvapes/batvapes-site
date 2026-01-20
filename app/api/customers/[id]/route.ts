import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    await prisma.customer.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    const msg =
      err?.code === "P2003"
        ? "Kan niet verwijderen: er hangen nog records aan deze klant (foreign key)."
        : err?.message || "Delete failed";

    return new NextResponse(msg, { status: 400 });
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        snapchat: body.snapchat,
        personalCode: body.personalCode,
        referralCode: body.referralCode,
        referredByCode: body.referredByCode || null,
      },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return new NextResponse(err?.message || "Update failed", { status: 400 });
  }
}
