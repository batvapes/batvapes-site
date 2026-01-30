import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const cookieStore = await cookies();
  const adminId = cookieStore.get("adminId")?.value;

  if (!adminId) {
    return NextResponse.json({ admin: null }, { status: 200 });
  }

  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    select: { id: true, username: true },
  });

  if (!admin) {
    // Cookie bestaat, maar admin niet meer -> cookie wissen via response
    const res = NextResponse.json({ admin: null }, { status: 200 });
    res.cookies.set("adminId", "", {
      path: "/",
      maxAge: 0,
      httpOnly: true,
      sameSite: "lax",
    });
    return res;
  }

  return NextResponse.json({ admin }, { status: 200 });
}
