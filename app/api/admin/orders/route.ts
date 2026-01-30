import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const cookieStore = await cookies();
  const adminId = cookieStore.get("adminId")?.value;
  return adminId ? adminId : null;
}

export async function GET(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const municipality = (url.searchParams.get("municipality") ?? "").trim();
  const deliveryDay = (url.searchParams.get("deliveryDay") ?? "").trim();
  const status = (url.searchParams.get("status") ?? "").trim();

  const where: any = {};
  if (municipality) where.municipality = municipality;
  if (deliveryDay) where.deliveryDay = deliveryDay;
  if (status === "open") where.isCompleted = false;
  if (status === "done") where.isCompleted = true;

  const orders = await prisma.order.findMany({
    where,
    orderBy: [{ deliveryDay: "asc" }, { deliveryStartMinutes: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      createdAt: true,
      snapchat: true,
      municipality: true,
      deliveryDay: true,
      deliveryStartMinutes: true,
      note: true,
      totalCents: true,
      isCompleted: true,
      items: {
        select: {
          id: true,
          quantity: true,
          priceCents: true,
          product: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return NextResponse.json({ orders }, { status: 200 });
}
