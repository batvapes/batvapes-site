import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const cookieStore = await cookies();
  const adminId = cookieStore.get("adminId")?.value;
  return adminId ? adminId : null;
}

export async function PATCH(req: Request, context: any) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await context?.params;
  const id = String(params?.id ?? "");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const isCompleted = Boolean(body?.isCompleted);

  try {
    const order = await prisma.order.update({
      where: { id },
      data: { isCompleted },
      select: { id: true, isCompleted: true },
    });
    return NextResponse.json({ order }, { status: 200 });
  } catch (e: any) {
    if (e?.code === "P2025") {
      return NextResponse.json({ error: "Order niet gevonden" }, { status: 404 });
    }
    console.error("PATCH /api/admin/orders/[id] error:", e);
    return NextResponse.json({ error: "Opslaan mislukt" }, { status: 500 });
  }
}
