import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function makeReferralCode() {
  // 6 chars, uppercase
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, customers });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Kon klanten niet ophalen" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, snapchat, personalCode, referralCode } = body; // referralCode = code van referrer

    if (!fullName || !snapchat || !personalCode || !referralCode) {
      return NextResponse.json({ error: "Ontbrekende velden" }, { status: 400 });
    }

    // check: bestaat die referrer code?
    const referrer = await prisma.customer.findUnique({
      where: { referralCode },
    });

    if (!referrer) {
      return NextResponse.json({ error: "Ongeldige referral code" }, { status: 404 });
    }

    // genereer unieke referralCode voor de nieuwe klant
    let newCode = makeReferralCode();
    for (let i = 0; i < 10; i++) {
      const exists = await prisma.customer.findUnique({ where: { referralCode: newCode } });
      if (!exists) break;
      newCode = makeReferralCode();
    }

    const customer = await prisma.customer.create({
      data: {
        fullName,
        snapchat,
        personalCode,
        referralCode: newCode,      // UNIQUE voor deze klant
        referredByCode: referralCode, // de code van de referrer
      },
    });

    return NextResponse.json({ success: true, customer });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
