import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function makeReferralCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as any;

    // In jouw schema is dit "username" (niet fullName)
    const username = (body?.username ?? body?.fullName ?? "").toString().trim();
    const snapchat = (body?.snapchat ?? "").toString().trim();
    const personalCode = (body?.personalCode ?? "").toString().trim();

    if (!username || !snapchat || !personalCode) {
      return NextResponse.json(
        { error: "username, snapchat en personalCode zijn verplicht" },
        { status: 400 }
      );
    }

    // unieke referral code maken
    let newCode = makeReferralCode();
    for (let i = 0; i < 15; i++) {
      const exists = await prisma.customer.findUnique({
        where: { referralCode: newCode },
        select: { id: true },
      });
      if (!exists) break;
      newCode = makeReferralCode();
    }

    const stillExists = await prisma.customer.findUnique({
      where: { referralCode: newCode },
      select: { id: true },
    });

    if (stillExists) {
      return NextResponse.json(
        { error: "Kon geen unieke referral code maken. Probeer opnieuw." },
        { status: 500 }
      );
    }

    const customer = await prisma.customer.create({
      data: {
        username,
        snapchat,
        personalCode,
        referralCode: newCode,
      },
    });

    return NextResponse.json({ success: true, customer }, { status: 201 });
  } catch (e) {
    console.error("Create customer error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
