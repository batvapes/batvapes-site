import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeText } from "@/lib/orderConfig";
import { isValidISODate, isDeliveryDateAllowed } from "@/lib/orderRules";
import {
  listAllSlots,
  minutesToHHMM,
  WINDOW_START_MINUTES,
  SERVICE_MINUTES_PER_STOP,
} from "@/lib/deliveryScheduler";

function badRequest(error: string, details?: string) {
  return NextResponse.json({ error, details }, { status: 400 });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const deliveryDayRaw = (url.searchParams.get("deliveryDay") ?? "").trim();
  const municipalityRaw = (url.searchParams.get("municipality") ?? "").trim();

  if (!isValidISODate(deliveryDayRaw)) {
    return badRequest("Ongeldige dag.");
  }
  if (!isDeliveryDateAllowed(deliveryDayRaw, new Date(), 21)) {
    return badRequest("Dag is niet toegelaten.");
  }

  const municipality = normalizeText(municipalityRaw).slice(0, 60);
  if (!municipality || municipality.length < 2) {
    return badRequest("Ongeldige gemeente.");
  }

  // Alle stops van die dag
  const stops = await prisma.deliveryStop.findMany({
    where: { deliveryDay: deliveryDayRaw },
    orderBy: { startMinutes: "asc" },
    select: { id: true, municipality: true, startMinutes: true, capacityUsed: true, capacityMax: true },
  });

  const lastStop = stops.length ? stops[stops.length - 1] : null;

  // Map voor snelle lookup (bestaande stop op municipality+time)
  const stopKey = (m: string, t: number) => `${m}__${t}`;
  const stopMap = new Map(stops.map((s) => [stopKey(s.municipality, s.startMinutes), s]));

  // Earliest start voor NIEUWE stop (append-only)
  let earliestNewStart = WINDOW_START_MINUTES;

  if (lastStop) {
    // travel minutes lastStop -> municipality
    const travel = await prisma.travelTime.findUnique({
      where: {
        fromMunicipality_toMunicipality: {
          fromMunicipality: lastStop.municipality,
          toMunicipality: municipality,
        },
      },
      select: { minutes: true },
    });

    if (!travel) {
      return badRequest(
        "Geen reistijd gevonden.",
        `TravelTime ontbreekt: ${lastStop.municipality} -> ${municipality}`
      );
    }

    earliestNewStart = lastStop.startMinutes + SERVICE_MINUTES_PER_STOP + travel.minutes;
  }

  const slots = listAllSlots(deliveryDayRaw).map((t) => {
    const existing = stopMap.get(stopKey(municipality, t)) ?? null;

    // 1) Als stop bestaat: enkel capacity check (je kan altijd nog “bij” een bestaande stop)
    if (existing) {
      const remaining = Math.max(0, existing.capacityMax - existing.capacityUsed);
      const disabled = remaining <= 0;
      return {
        startMinutes: t,
        label: minutesToHHMM(t),
        disabled,
        reason: disabled ? "Volzet" : null,
        remaining,
        existingStop: true,
      };
    }

    // 2) Nieuwe stop (bestaat nog niet): enkel als tijd >= earliestNewStart
    const disabled = t < earliestNewStart;
    return {
      startMinutes: t,
      label: minutesToHHMM(t),
      disabled,
      reason: disabled ? "Te vroeg (route zit vol)" : null,
      remaining: 3,
      existingStop: false,
    };
  });

  return NextResponse.json(
    {
      ok: true,
      deliveryDay: deliveryDayRaw,
      municipality,
      earliestNewStartMinutes: earliestNewStart,
      slots,
    },
    { status: 200 }
  );
}
