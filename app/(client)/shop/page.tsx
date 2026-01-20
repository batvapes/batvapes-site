"use client";

import Link from "next/link";
import { CATEGORIES } from "@/lib/productCategories";

export default function ShopCategoriesPage() {
  return (
    <div className="mx-auto max-w-6xl p-4">
      <h1 className="text-xl font-black mb-3">Shop</h1>
      <p className="opacity-70 mb-4">Kies een categorie</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {CATEGORIES.map((c) => (
          <Link
            key={c.value}
            href={`/shop/${c.value}`}
            className="rounded-2xl border bg-white p-5 hover:bg-gray-50"
          >
            <div className="text-lg font-black">{c.label}</div>
            <div className="mt-1 text-sm opacity-70">
              Bekijk producten in {c.label.toLowerCase()}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
