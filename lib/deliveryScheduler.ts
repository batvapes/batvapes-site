import { isoToSafeDate, getBrusselsWeekdayName } from "@/lib/orderRules";

export const SERVICE_MINUTES_PER_STOP = 15;
export const SLOT_STEP_MINUTES = 15;

// 17:30
export const WINDOW_START_MINUTES = 17 * 60 + 30;

// Week: tot 00:00 => laatste start 23:45
export const WEEK_END_MINUTES = 24 * 60;

// Weekend-nacht: tot 02:00 => laatste start 01:45 (dat is 24*60 + 105)
export const WEEKEND_END_MINUTES = 26 * 60;

// Weekend-nacht definieer ik als: vrijdag + zaterdag (nachten)
export function isWeekendNight(isoDay: string): boolean {
  const d = isoToSafeDate(isoDay);
  const wd = getBrusselsWeekdayName(d); // nl-BE
  return wd === "vrijdag" || wd === "zaterdag";
}

export function getWindowEndMinutes(isoDay: string): number {
  return isWeekendNight(isoDay) ? WEEKEND_END_MINUTES : WEEK_END_MINUTES;
}

export function minutesToHHMM(totalMinutes: number): string {
  const m = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hh = String(Math.floor(m / 60)).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function listAllSlots(isoDay: string): number[] {
  const end = getWindowEndMinutes(isoDay);
  const slots: number[] = [];
  for (let t = WINDOW_START_MINUTES; t <= end - SLOT_STEP_MINUTES; t += SLOT_STEP_MINUTES) {
    slots.push(t);
  }
  return slots;
}
