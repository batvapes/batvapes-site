import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const cookieStore = await cookies();
  const customerId = cookieStore.get("customerId")?.value;

  if (!customerId) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { customerId }, // ✅ dit werkt nu omdat POST customerId opslaat
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      municipality: true,
      deliveryDay: true,
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
