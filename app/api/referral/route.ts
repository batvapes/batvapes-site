import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Dit endpoint bestaat enkel om duidelijk te antwoorden als iemand per ongeluk
 * POST naar /api/referral stuurt i.p.v. /api/referral/[code].
 */
export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { error: "Gebruik /api/referral/[code] (bv. /api/referral/ABC123)" },
    { status: 400 }
  );
}
