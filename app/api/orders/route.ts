import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { normalizeText } from "@/lib/orderConfig";
import { isValidISODate, isDeliveryDateAllowed } from "@/lib/orderRules";
import {
  listAllSlots,
  WINDOW_START_MINUTES,
  SERVICE_MINUTES_PER_STOP,
} from "@/lib/deliveryScheduler";

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
    const deliveryStartMinutesRaw = body?.deliveryStartMinutes;
    const noteRaw = body?.note ?? null;
    const itemsRaw = body?.items;

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
    const deliveryDay = deliveryDayRaw.trim(); // YYYY-MM-DD
    if (!isValidISODate(deliveryDay)) {
      return badRequest("Ongeldige dag.");
    }
    if (!isDeliveryDateAllowed(deliveryDay, new Date(), 21)) {
      return badRequest("Je kan niet voor vandaag bestellen.");
    }

    if (!Number.isInteger(deliveryStartMinutesRaw)) {
      return badRequest("Ongeldig tijdslot.");
    }
    const deliveryStartMinutes = Number(deliveryStartMinutesRaw);

    // slot moet bestaan in window
    const allowedSlots = new Set(listAllSlots(deliveryDay));
    if (!allowedSlots.has(deliveryStartMinutes)) {
      return badRequest("Tijdslot is niet toegelaten.");
    }

    // items
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

    // merge duplicates
    const mergedMap = new Map<string, number>();
    for (const it of items) {
      mergedMap.set(it.productId, (mergedMap.get(it.productId) ?? 0) + it.quantity);
    }
    const mergedItems = Array.from(mergedMap.entries()).map(([productId, quantity]) => ({
      productId,
      quantity,
    }));

    // products fetch + stock check
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

    const cookieStore = await cookies();
    const customerId = cookieStore.get("customerId")?.value ?? null;

    const created = await prisma.$transaction(async (tx) => {
      // 1) check bestaande stop op dat exact moment
      const existingStop = await tx.deliveryStop.findUnique({
        where: {
          deliveryDay_municipality_startMinutes: {
            deliveryDay,
            municipality,
            startMinutes: deliveryStartMinutes,
          },
        },
        select: { id: true, capacityUsed: true, capacityMax: true },
      });

      if (existingStop) {
        if (existingStop.capacityUsed >= existingStop.capacityMax) {
          throw new Error("SLOT_FULL");
        }

        // reserve spot
        await tx.deliveryStop.update({
          where: { id: existingStop.id },
          data: { capacityUsed: { increment: 1 } },
        });

        const order = await tx.order.create({
          data: {
            snapchat,
            municipality,
            deliveryDay,
            deliveryStartMinutes,
            note,
            totalCents,
            customerId,
            deliveryStopId: existingStop.id,
            items: { create: itemsCreate },
          },
          select: { id: true },
        });

        // stock decrement
        for (const it of mergedItems) {
          await tx.product.update({
            where: { id: it.productId },
            data: { stockQty: { decrement: it.quantity } },
          });
        }

        return order;
      }

      // 2) nieuwe stop: append-only logica (na laatste stop)
      const lastStop = await tx.deliveryStop.findFirst({
        where: { deliveryDay },
        orderBy: { startMinutes: "desc" },
        select: { municipality: true, startMinutes: true },
      });

      let earliestNewStart = WINDOW_START_MINUTES;

      if (lastStop) {
        const travel = await tx.travelTime.findUnique({
          where: {
            fromMunicipality_toMunicipality: {
              fromMunicipality: lastStop.municipality,
              toMunicipality: municipality,
            },
          },
          select: { minutes: true },
        });

        if (!travel) {
          throw new Error(`TRAVELTIME_MISSING:${lastStop.municipality}->${municipality}`);
        }

        earliestNewStart = lastStop.startMinutes + SERVICE_MINUTES_PER_STOP + travel.minutes;
      }

      if (deliveryStartMinutes < earliestNewStart) {
        throw new Error("SLOT_TOO_EARLY");
      }

      // create stop with 1 reserved
      const stop = await tx.deliveryStop.create({
        data: {
          deliveryDay,
          municipality,
          startMinutes: deliveryStartMinutes,
          capacityMax: 3,
          capacityUsed: 1,
        },
        select: { id: true },
      });

      const order = await tx.order.create({
        data: {
          snapchat,
          municipality,
          deliveryDay,
          deliveryStartMinutes,
          note,
          totalCents,
          customerId,
          deliveryStopId: stop.id,
          items: { create: itemsCreate },
        },
        select: { id: true },
      });

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

    if (msg === "SLOT_FULL") {
      return badRequest("Dit tijdslot is volzet. Kies een ander slot.");
    }
    if (msg === "SLOT_TOO_EARLY") {
      return badRequest("Dit tijdslot is te vroeg. Kies een later slot.");
    }
    if (msg.startsWith("TRAVELTIME_MISSING:")) {
      return badRequest("Geen reistijd gevonden.", msg.replace("TRAVELTIME_MISSING:", ""));
    }

    return NextResponse.json(
      { error: "Server error bij order plaatsen.", details: msg },
      { status: 500 }
    );
  }
}
