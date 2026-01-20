import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const snapchat = String(body?.snapchat ?? "").trim();
  const password = String(body?.password ?? "");

  if (!snapchat || !password) {
    return NextResponse.json({ error: "Vul snapchat en wachtwoord in" }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({
    where: { snapchat },
    select: { id: true, passwordHash: true },
  });

  if (!customer) return NextResponse.json({ error: "Onjuiste login" }, { status: 401 });
  if (!customer.passwordHash) {
    return NextResponse.json({ error: "Dit account heeft nog geen wachtwoord ingesteld" }, { status: 400 });
  }

  const ok = await bcrypt.compare(password, customer.passwordHash);
  if (!ok) return NextResponse.json({ error: "Onjuiste login" }, { status: 401 });

  const cookieStore = await cookies();

  // ✅ klant login -> admin cookie weg
  cookieStore.set("adminId", "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });

  cookieStore.set("customerId", customer.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.set("customerId", "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return NextResponse.json({ ok: true }, { status: 200 });
}
