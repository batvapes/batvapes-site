import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as any;
    const token = (body?.token ?? "").toString().trim();

    if (!token) {
      return NextResponse.json({ error: "Token ontbreekt" }, { status: 400 });
    }

    const cleanToken = token.toUpperCase();

    // ✅ Model heet "Invite" in Prisma => prisma.invite
    const invite = await prisma.invite.findUnique({
      where: { code: cleanToken },
      select: {
        id: true,
        used: true,
        expiresAt: true,
        customerId: true,
      },
    });

    if (!invite) {
      return NextResponse.json({ error: "Ongeldige invite" }, { status: 404 });
    }

    if (invite.used) {
      return NextResponse.json({ error: "Invite is al gebruikt" }, { status: 400 });
    }

    if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: "Invite is verlopen" }, { status: 400 });
    }

    // Markeer als gebruikt
    await prisma.invite.update({
      where: { id: invite.id },
      data: { used: true },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e) {
    console.error("Invite error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
