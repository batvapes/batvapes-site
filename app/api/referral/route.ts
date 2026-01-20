import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";

const prisma = new PrismaClient();

type Ctx = {
  params: { code: string } | Promise<{ code: string }>;
};

export async function POST(req: Request, ctx: Ctx) {
  try {
    // ✅ belangrijk: params kunnen een Promise zijn
    const { code } = await ctx.params;
    const referralCode = (code ?? "").toString().trim().toUpperCase();

    if (!referralCode) {
      return NextResponse.json(
        { error: "Referral code ontbreekt" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => null) as any;
    const fullName = (body?.fullName ?? "").toString().trim();
    const snapchat = (body?.snapchat ?? "").toString().trim();
    const personalCode = (body?.personalCode ?? "").toString().trim();

    if (!fullName || !snapchat || !personalCode) {
      return NextResponse.json(
        { error: "fullName, snapchat en personalCode zijn verplicht" },
        { status: 400 }
      );
    }

    // Bestaat referrer?
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

    // Maak unieke referral code voor nieuwe klant
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
        fullName,
        snapchat,
        personalCode,
        referralCode: newCode,
        referredByCode: referralCode, // sla referrer op
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
