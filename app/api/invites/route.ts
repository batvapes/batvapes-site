import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function makeCode(len = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function buildInvitePath(code: string) {
  return `/register?invite=${encodeURIComponent(code)}`;
}

export async function GET() {
  const invites = await prisma.invite.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      code: true,
      used: true,
      expiresAt: true,
      customerId: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ invites });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const customerId = body?.customerId ? String(body.customerId) : null;

  let code = makeCode(10);
  for (let i = 0; i < 20; i++) {
    const exists = await prisma.invite.findUnique({ where: { code } });
    if (!exists) break;
    code = makeCode(10);
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const invite = await prisma.invite.create({
    data: {
      code,
      used: false,
      expiresAt,
      customerId,
    },
    select: {
      id: true,
      code: true,
      used: true,
      expiresAt: true,
      customerId: true,
      createdAt: true,
    },
  });

  const origin = new URL(req.url).origin;
  const path = buildInvitePath(invite.code);
  const url = `${origin}${path}`;

  return NextResponse.json({ invite, code: invite.code, path, url });
}
