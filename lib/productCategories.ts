export type ProductCategory = "VAPES" | "KLEDIJ";

export const CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: "VAPES", label: "Vapes" },
  { value: "KLEDIJ", label: "Kledij" },
];

export function normalizeCategory(v: any): ProductCategory {
  const s = String(v ?? "").toUpperCase().trim();
  if (s === "KLEDIJ" || s === "CLOTHING") return "KLEDIJ";
  return "VAPES";
}
