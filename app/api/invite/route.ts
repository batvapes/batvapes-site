import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

type RouteCtx = { params: Promise<{ token: string }> };

export async function POST(req: Request, ctx: RouteCtx) {
  try {
    const { token } = await ctx.params; // ✅ BELANGRIJK: await!
    const cleanToken = (token ?? "").trim();

    if (!cleanToken) {
      return NextResponse.json({ error: "Token ontbreekt" }, { status: 400 });
    }

    const invite = await prisma.inviteLink.findUnique({
      where: { token: cleanToken },
      select: {
        id: true,
        expiresAt: true,
        usedAt: true,
        createdById: true,
        referralCode: true,
      },
    });

    if (!invite) return NextResponse.json({ error: "Invite bestaat niet" }, { status: 404 });
    if (invite.usedAt) return NextResponse.json({ error: "Invite is al gebruikt" }, { status: 409 });
    if (invite.expiresAt.getTime() < Date.now()) return NextResponse.json({ error: "Invite is verlopen" }, { status: 410 });

    const body = await req.json().catch(() => ({}));
    const snapchat = (body?.snapchat ?? "").trim();
    const personalCode = (body?.personalCode ?? "").trim();

    if (!snapchat || !personalCode) {
      return NextResponse.json({ error: "snapchat en personalCode zijn verplicht" }, { status: 400 });
    }

    // referrer ophalen en referredByCode invullen
    const referrer = await prisma.customer.findUnique({
      where: { id: invite.createdById },
      select: { referralCode: true },
    });

    // ✅ Customer krijgt EXACT dezelfde referralCode als invite
    const created = await prisma.customer.create({
      data: {
        snapchat,
        personalCode,
        referralCode: invite.referralCode,
        referredByCode: referrer?.referralCode ?? null,
        fullName: null,
      },
      select: { id: true, referralCode: true, snapchat: true, createdAt: true },
    });

    // invite markeren als gebruikt
    await prisma.inviteLink.update({
      where: { id: invite.id },
      data: { usedAt: new Date(), usedById: created.id },
    });

    return NextResponse.json({ success: true, customer: created }, { status: 201 });
  } catch (error) {
    console.error("Consume invite error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
