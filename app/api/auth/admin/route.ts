import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const username = String(body?.username ?? "").trim();
  const password = String(body?.password ?? "");

  if (!username || !password) {
    return NextResponse.json({ error: "Vul username en wachtwoord in" }, { status: 400 });
  }

  const admin = await prisma.admin.findUnique({
    where: { username },
    select: { id: true, passwordHash: true },
  });

  if (!admin) return NextResponse.json({ error: "Onjuiste login" }, { status: 401 });

  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) return NextResponse.json({ error: "Onjuiste login" }, { status: 401 });

  const cookieStore = await cookies();

  // ✅ admin login -> klant cookie weg
  cookieStore.set("customerId", "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });

  cookieStore.set("adminId", admin.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.set("adminId", "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return NextResponse.json({ ok: true }, { status: 200 });
}
