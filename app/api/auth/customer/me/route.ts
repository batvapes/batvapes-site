import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const cookieStore = await cookies();
  const customerId = cookieStore.get("customerId")?.value;

  if (!customerId) return NextResponse.json({ customer: null }, { status: 200 });

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { id: true, snapchat: true },
  });

  return NextResponse.json({ customer: customer ?? null }, { status: 200 });
}
