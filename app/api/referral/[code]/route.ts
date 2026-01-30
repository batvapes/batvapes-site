import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ code: string }>;
};

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { code } = await context.params;
    const referralCode = (code ?? "").toString().trim().toUpperCase();

    if (!referralCode) {
      return NextResponse.json(
        { error: "Referral code ontbreekt" },
        { status: 400 }
      );
    }

    const body = (await req.json().catch(() => null)) as any;

    // In jouw schema heet het "username" (en je fallbackt eventueel op fullName)
    const username = (body?.username ?? body?.fullName ?? "")
      .toString()
      .trim();

    const snapchat = (body?.snapchat ?? "").toString().trim();
    const personalCode = (body?.personalCode ?? "").toString().trim();

    if (!username || !snapchat || !personalCode) {
      return NextResponse.json(
        { error: "username, snapchat en personalCode zijn verplicht" },
        { status: 400 }
      );
    }

    const referrer = await prisma.customer.findUnique({
      where: { referralCode },
      select: { id: true, referralCode: true },
    });

    if (!referrer) {
      return NextResponse.json(
        { error: "Ongeldige referral link" },
        { status: 404 }
      );
    }

    const makeReferralCode = () =>
      Math.random().toString(36).slice(2, 8).toUpperCase();

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
        referredByCode: referralCode,
      },
    });

    return NextResponse.json(
      { success: true, customer, referrerCode: referralCode },
      { status: 201 }
    );
  } catch (error) {
    console.error("Referral signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
