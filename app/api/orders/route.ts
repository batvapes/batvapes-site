import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { normalizeText } from "@/lib/orderConfig";
import { isValidISODate, isDeliveryDateAllowed } from "@/lib/orderRules";

type IncomingItem = {
  productId: string;
  quantity: number;
};

function badRequest(error: string, details?: string) {
  return NextResponse.json({ error, details }, { status: 400 });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const snapchatRaw = body?.snapchat;
    const municipalityRaw = body?.municipality;
    const deliveryDayRaw = body?.deliveryDay;
    const noteRaw = body?.note ?? null;
    const itemsRaw = body?.items;

    // ✅ basis validaties
    if (typeof snapchatRaw !== "string" || !snapchatRaw.trim()) {
      return badRequest("Ongeldige snapchat.");
    }
    const snapchat = snapchatRaw.trim().slice(0, 50);

    if (typeof municipalityRaw !== "string") {
      return badRequest("Ongeldige gemeente.");
    }
    const municipality = normalizeText(municipalityRaw).slice(0, 60);
    if (municipality.length < 2) {
      return badRequest("Ongeldige gemeente.");
    }

    if (typeof deliveryDayRaw !== "string") {
      return badRequest("Ongeldige dag.");
    }
    const deliveryDay = deliveryDayRaw.trim(); // ISO date: YYYY-MM-DD

    if (!isValidISODate(deliveryDay)) {
      return badRequest("Ongeldige dag.");
    }
    if (!isDeliveryDateAllowed(deliveryDay, new Date(), 21)) {
      return badRequest(
        "Je kan niet voor vandaag bestellen.",
        "Bestellen kan enkel voor zaterdag/zondag en nooit voor vandaag."
      );
    }

    // ✅ items validatie
    if (!Array.isArray(itemsRaw) || itemsRaw.length === 0) {
      return badRequest("Je winkelmand is leeg.");
    }

    const items: IncomingItem[] = itemsRaw
      .map((it: any) => ({
        productId: typeof it?.productId === "string" ? it.productId : "",
        quantity: Number.isFinite(it?.quantity) ? Number(it.quantity) : NaN,
      }))
      .filter((it) => it.productId && Number.isInteger(it.quantity) && it.quantity > 0);

    if (items.length === 0) {
      return badRequest("Ongeldige items in winkelmand.");
    }

    // combine duplicates (zelfde productId)
    const mergedMap = new Map<string, number>();
    for (const it of items) {
      mergedMap.set(it.productId, (mergedMap.get(it.productId) ?? 0) + it.quantity);
    }
    const mergedItems = Array.from(mergedMap.entries()).map(([productId, quantity]) => ({
      productId,
      quantity,
    }));

    // ✅ producten ophalen + prijzen + stock check
    const productIds = mergedItems.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, priceCents: true, stockQty: true, isActive: true },
    });

    const productById = new Map(products.map((p) => [p.id, p]));

    for (const it of mergedItems) {
      const p = productById.get(it.productId);
      if (!p) {
        return badRequest("Ongeldig product in winkelmand.", `Product niet gevonden: ${it.productId}`);
      }
      if (!p.isActive) {
        return badRequest("Product is niet actief.", p.name);
      }
      if (p.stockQty < it.quantity) {
        return badRequest("Onvoldoende stock.", `${p.name} — stock: ${p.stockQty}, gevraagd: ${it.quantity}`);
      }
    }

    // ✅ totaal berekenen + nested create items bouwen
    const itemsCreate = mergedItems.map((it) => {
      const p = productById.get(it.productId)!;
      return {
        product: { connect: { id: p.id } },
        quantity: it.quantity,
        priceCents: p.priceCents,
      };
    });

    const totalCents = mergedItems.reduce((sum, it) => {
      const p = productById.get(it.productId)!;
      return sum + p.priceCents * it.quantity;
    }, 0);

    const note =
      typeof noteRaw === "string" && noteRaw.trim()
        ? noteRaw.trim().slice(0, 200)
        : null;

    // ✅ klant koppelen als cookie bestaat (past bij jouw auth flow)
    const cookieStore = await cookies();
    const customerId = cookieStore.get("customerId")?.value ?? null;

    // ✅ transacties: order creëren + stock decrements
    const created = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          snapchat,
          municipality,
          deliveryDay, // store ISO date string
          note,
          totalCents,
          customerId,
          items: { create: itemsCreate },
        },
        select: { id: true },
      });

      // stock verminderen
      for (const it of mergedItems) {
        await tx.product.update({
          where: { id: it.productId },
          data: { stockQty: { decrement: it.quantity } },
        });
      }

      return order;
    });

    return NextResponse.json({ ok: true, orderId: created.id }, { status: 201 });
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Onbekende server fout";
    return NextResponse.json(
      { error: "Server error bij order plaatsen.", details: msg },
      { status: 500 }
    );
  }
}
