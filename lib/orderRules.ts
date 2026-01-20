// src/lib/orderRules.ts
import { BRUSSELS_TZ } from "./orderConfig";

/**
 * DeliveryDay is an ISO date string: "YYYY-MM-DD"
 * Rules (NEW):
 * - today is NEVER allowed
 * - ALL other days are allowed (including weekdays)
 * - optional max range (e.g. 21 days ahead)
 */

export type DeliveryDateISO = string; // "YYYY-MM-DD"

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function getBrusselsYMDParts(date: Date) {
  const parts = new Intl.DateTimeFormat("nl-BE", {
    timeZone: BRUSSELS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  return { year, month, day };
}

export function getBrusselsTodayISO(now = new Date()): DeliveryDateISO {
  const { year, month, day } = getBrusselsYMDParts(now);
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function isValidISODate(value: unknown): value is DeliveryDateISO {
  if (typeof value !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const m = Number(value.slice(5, 7));
  const d = Number(value.slice(8, 10));
  return m >= 1 && m <= 12 && d >= 1 && d <= 31;
}

/**
 * Safe parse: noon UTC avoids timezone drift around midnight.
 */
export function isoToSafeDate(iso: DeliveryDateISO): Date {
  return new Date(`${iso}T12:00:00.000Z`);
}

export function getBrusselsWeekdayName(date: Date): string {
  return new Intl.DateTimeFormat("nl-BE", {
    timeZone: BRUSSELS_TZ,
    weekday: "long",
  })
    .format(date)
    .toLowerCase()
    .trim();
}

/**
 * Main rule:
 * - block today and past
 * - allow any future date (optionally limit how far ahead)
 */
export function isDeliveryDateAllowed(
  iso: DeliveryDateISO,
  now = new Date(),
  maxDaysAhead = 21
): boolean {
  if (!isValidISODate(iso)) return false;

  const todayIso = getBrusselsTodayISO(now);

  // Block today and anything before today
  if (iso <= todayIso) return false;

  // Optional max range guard
  const todayDate = isoToSafeDate(todayIso);
  const chosen = isoToSafeDate(iso);
  const diffDays = Math.floor(
    (chosen.getTime() - todayDate.getTime()) / (24 * 3600 * 1000)
  );

  return diffDays >= 1 && diffDays <= maxDaysAhead;
}

/**
 * UI helper:
 * - show all days from today -> today+N
 * - ONLY disable today
 */
export function getDeliveryDateOptions(now = new Date(), daysAhead = 21) {
  const todayIso = getBrusselsTodayISO(now);
  const base = isoToSafeDate(todayIso);

  const out: { value: DeliveryDateISO; label: string; disabled: boolean }[] = [];

  for (let i = 0; i <= daysAhead; i++) {
    const d = new Date(base.getTime() + i * 24 * 3600 * 1000);

    const iso = getBrusselsTodayISO(d);
    const weekday = getBrusselsWeekdayName(d);

    const ddmm = new Intl.DateTimeFormat("nl-BE", {
      timeZone: BRUSSELS_TZ,
      day: "2-digit",
      month: "2-digit",
    }).format(d);

    const label = `${weekday} ${ddmm}`;

    const disabled = iso === todayIso; // ✅ ONLY today disabled

    out.push({ value: iso, label, disabled });
  }

  return out;
}

export function formatDeliveryDateLabel(value: string): string {
  if (!isValidISODate(value)) return value;

  const d = isoToSafeDate(value);
  const weekday = getBrusselsWeekdayName(d);
  const ddmm = new Intl.DateTimeFormat("nl-BE", {
    timeZone: BRUSSELS_TZ,
    day: "2-digit",
    month: "2-digit",
  }).format(d);

  return `${weekday} ${ddmm}`;
}
