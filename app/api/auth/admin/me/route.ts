import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const cookieStore = await cookies();
  const adminId = cookieStore.get("adminId")?.value;

  if (!adminId) return NextResponse.json({ admin: null }, { status: 200 });

  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    select: { id: true, username: true },
  });

  return NextResponse.json({ admin: admin ?? null }, { status: 200 });
}
