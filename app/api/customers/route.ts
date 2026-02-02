import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/customers  -> lijst klanten (admin dashboard)
export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        snapchat: true,
        username: true,          // als je schema dit heeft
        personalCode: true,
        referralCode: true,
        referredByCode: true,
      },
    });

    return NextResponse.json({ success: true, customers });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ error: "Kon klanten niet ophalen" }, { status: 500 });
  }
}

// (optioneel) POST blijft bestaan als je dit nog gebruikt ergens
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // we supporten beide namen: username of fullName (backward compatible)
    const username = (body.username ?? body.fullName ?? "").toString().trim();
    const snapchat = (body.snapchat ?? "").toString().trim();
    const personalCode = (body.personalCode ?? "").toString().trim();
    const referralCode = (body.referralCode ?? "").toString().trim();

    if (!username || !snapchat || !personalCode || !referralCode) {
      return NextResponse.json({ error: "Ontbrekende velden" }, { status: 400 });
    }

    // check: bestaat de referrer code?
    const referrer = await prisma.customer.findUnique({
      where: { referralCode },
      select: { id: true },
    });

    if (!referrer) {
      return NextResponse.json({ error: "Ongeldige referral code" }, { status: 404 });
    }

    // maak simpele code generator
    const makeReferralCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

    // genereer unieke referralCode voor nieuwe klant
    let newCode = makeReferralCode();
    for (let i = 0; i < 20; i++) {
      const exists = await prisma.customer.findUnique({
        where: { referralCode: newCode },
        select: { id: true },
      });
      if (!exists) break;
      newCode = makeReferralCode();
    }

    const customer = await prisma.customer.create({
      data: {
        username,
        snapchat,
        personalCode,
        referralCode: newCode,
        referredByCode: referralCode,
      },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        snapchat: true,
        username: true,
        personalCode: true,
        referralCode: true,
        referredByCode: true,
      },
    });

    return NextResponse.json({ success: true, customer });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
