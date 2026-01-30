import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

type CustomerLoginRow = {
  id: string;
  passwordHash: string | null;
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    // ✅ Backwards compatible met jouw huidige UI (snapchat + password)
    const identifier = String(body?.snapchat ?? body?.identifier ?? "").trim();
    const password = String(body?.password ?? "");

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Vul snapchat en wachtwoord in" },
        { status: 400 }
      );
    }

    // ✅ SQLITE case-insensitive lookup via LOWER()
    // Prisma Model = Customer => table naam is standaard "Customer" in SQLite
    const rows = (await prisma.$queryRaw<CustomerLoginRow[]>`
      SELECT id, passwordHash
      FROM Customer
      WHERE lower(snapchat) = lower(${identifier})
         OR lower(username)  = lower(${identifier})
      LIMIT 1
    `) as CustomerLoginRow[];

    const customer = rows?.[0];

    if (!customer) {
      return NextResponse.json({ error: "Onjuiste login" }, { status: 401 });
    }

    if (!customer.passwordHash) {
      return NextResponse.json(
        { error: "Dit account heeft nog geen wachtwoord ingesteld" },
        { status: 400 }
      );
    }

    // 🔐 Wachtwoord blijft case-sensitive
    const ok = await bcrypt.compare(password, customer.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Onjuiste login" }, { status: 401 });
    }

    // ✅ cookies() is async in Next 16
    const cookieStore = await cookies();

    // klant login -> admin cookie weg
    cookieStore.set("adminId", "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    cookieStore.set("customerId", customer.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("Customer login error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.set("customerId", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return NextResponse.json({ ok: true }, { status: 200 });
}
