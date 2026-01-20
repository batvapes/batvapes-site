// src/lib/orderConfig.ts

export const WEEK_DAYS = [
  "maandag",
  "dinsdag",
  "woensdag",
  "donderdag",
  "vrijdag",
  "zaterdag",
  "zondag",
] as const;

export type WeekDay = (typeof WEEK_DAYS)[number];

export const GEMEENTEN = [
  "Antwerpen Stad",
  "Berendrecht",
  "Borgerhout",
  "Brasschaat",
  "Brecht",
  "Deurne",
  "Ekeren",
  "Gooreind",
  "Hoevenen",
  "Kalmthout",
  "Kapellen",
  "Merksem",
  "Putte",
  "Schilde",
  "Schoten",
  "Sint-Job",
  "Stabroek",
  "Wijnegem",
  "Wommelgem",
  "Wuustwezel",
  "Zandvliet",
] as const;

export const BRUSSELS_TZ = "Europe/Brussels";

export function normalizeText(input: string) {
  return input.trim().replace(/\s+/g, " ");
}

export function isValidWeekDay(value: unknown): value is WeekDay {
  return typeof value === "string" && (WEEK_DAYS as readonly string[]).includes(value);
}
