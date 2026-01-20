import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

function makeCode(len = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const inviteCode = String(body?.invite ?? "").trim();
    const snapchat = String(body?.snapchat ?? "").trim();
    const password = String(body?.password ?? "");

    if (!inviteCode) return NextResponse.json({ error: "Invite ontbreekt" }, { status: 400 });
    if (!snapchat) return NextResponse.json({ error: "Snapchat is verplicht" }, { status: 400 });
    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Wachtwoord moet minstens 6 tekens zijn" }, { status: 400 });
    }

    // 1) Invite ophalen en checken
    const invite = await prisma.invite.findUnique({
      where: { code: inviteCode },
      select: {
        id: true,
        code: true,
        used: true,
        expiresAt: true,
      },
    });

    if (!invite) return NextResponse.json({ error: "Invite bestaat niet" }, { status: 404 });
    if (invite.used) return NextResponse.json({ error: "Invite is al gebruikt" }, { status: 400 });

    const now = new Date();
    if (invite.expiresAt < now) {
      return NextResponse.json({ error: "Invite is vervallen (ouder dan 24u)" }, { status: 400 });
    }

    // 2) Geen dubbele snapchat accounts (snapchat is @unique in schema)
    const existing = await prisma.customer.findUnique({
      where: { snapchat },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ error: "Deze Snapchat bestaat al als account" }, { status: 400 });
    }

    // 3) Customer aanmaken + password hash
    const personalCode = `P-${makeCode(6)}`;
    const referralCode = `R-${makeCode(6)}`;
    const passwordHash = await bcrypt.hash(password, 10);

    const customer = await prisma.customer.create({
      data: {
        snapchat,
        personalCode,
        referralCode,
        referredByCode: null,
        passwordHash,
      },
      select: {
        id: true,
        snapchat: true,
        personalCode: true,
        referralCode: true,
        createdAt: true,
      },
    });

    // 4) Invite markeren als gebruikt (single-use)
    await prisma.invite.update({
      where: { code: inviteCode },
      data: {
        used: true,
        customerId: customer.id,
      },
    });

    // 5) Customer cookie zetten zodat klant meteen ingelogd is
    const cookieStore = await cookies();
    cookieStore.set("customerId", customer.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });

    return NextResponse.json({ ok: true, customer }, { status: 200 });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return NextResponse.json({ error: "Serverfout bij registreren" }, { status: 500 });
  }
}
