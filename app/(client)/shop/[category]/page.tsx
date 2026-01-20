"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { addToCart } from "@/lib/cartStorage";
import { CATEGORIES, type ProductCategory } from "@/lib/productCategories";

type Product = {
  id: string;
  name: string;
  priceCents: number;
  isActive: boolean;
  stockQty: number;
  category: ProductCategory;
  description?: string | null;
};

const eur = (c: number) => `€${(c / 100).toFixed(2)}`;

function normalizeCategory(raw: unknown): ProductCategory | null {
  const s = String(raw ?? "").trim().toUpperCase();
  if (s === "VAPES") return "VAPES";
  if (s === "KLEDIJ") return "KLEDIJ";
  if (s === "CLOTHING") return "KLEDIJ"; // optioneel
  return null;
}

export default function CategoryProductsPage() {
  const params = useParams(); // ✅ dit update correct bij client navigatie

  const category = useMemo<ProductCategory | null>(() => {
    // In Next.js kan params.category string of string[] zijn
    const raw = (params as any)?.category;
    const value = Array.isArray(raw) ? raw[0] : raw;
    return normalizeCategory(value);
  }, [params]);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // per product: gekozen aantal
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [addedModal, setAddedModal] = useState<{ open: boolean; lastName?: string }>({
    open: false,
  });

  // ✅ Load producten wanneer category geldig is
  useEffect(() => {
    if (!category) return;

    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products?category=${category}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        const list = Array.isArray(data?.products) ? data.products : [];
        setProducts(list);
        setPicked({});
      } finally {
        setLoading(false);
      }
    })();
  }, [category]);

  const visible = useMemo(() => products.filter((p) => p.isActive), [products]);

  function inc(id: string, max: number) {
    setPicked((prev) => {
      const cur = prev[id] ?? 0;
      if (cur >= max) return prev;
      return { ...prev, [id]: cur + 1 };
    });
  }

  function dec(id: string) {
    setPicked((prev) => {
      const cur = prev[id] ?? 0;
      const next = Math.max(0, cur - 1);
      return { ...prev, [id]: next };
    });
  }

  function commitAdd(p: Product) {
    const qty = picked[p.id] ?? 0;
    if (qty <= 0) return;
    addToCart(p.id, qty);
    setPicked((prev) => ({ ...prev, [p.id]: 0 }));
    setAddedModal({ open: true, lastName: p.name });
  }

  // ✅ Als category ongeldig is: GEEN redirect meer → gewoon UI tonen
  if (!category) {
    return (
      <div className="mx-auto max-w-6xl p-4">
        <h1 className="text-xl font-black mb-2">Ongeldige categorie</h1>
        <p className="opacity-70 mb-4">Ga terug en kies een categorie.</p>
        <Link href="/shop" className="rounded-xl border px-4 py-2 font-bold bg-white inline-block">
          ← Terug naar categorieën
        </Link>
      </div>
    );
  }

  const currentLabel = CATEGORIES.find((c) => c.value === category)?.label ?? category;

  return (
    <div className="mx-auto max-w-6xl p-4">
      {/* TOP BAR IN PAGE */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link href="/shop" className="rounded-xl border px-4 py-2 font-bold bg-white">
          ← Categorieën
        </Link>

        <div className="flex-1" />

        {/* ✅ Switch category via Link (super stabiel) */}
        <div className="flex items-center gap-2">
          {CATEGORIES.map((c) => (
            <Link
              key={c.value}
              href={`/shop/${c.value}`}
              className={`rounded-xl border px-4 py-2 font-bold ${
                category === c.value ? "bg-black text-white" : "bg-white"
              }`}
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>

      <h1 className="text-xl font-black mb-2">{currentLabel}</h1>

      {loading ? <p>Laden…</p> : null}

      {!loading && visible.length === 0 ? (
        <div className="rounded-xl border bg-white p-4 opacity-70">Geen producten in deze categorie.</div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {visible.map((p) => {
          const qty = picked[p.id] ?? 0;
          const out = p.stockQty <= 0;

          return (
            <div key={p.id} className="rounded-xl border bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-lg truncate">{p.name}</div>
                  <div className="text-sm opacity-70">{eur(p.priceCents)}</div>
                  <div className="text-xs opacity-60 mt-1">Stock: {p.stockQty}</div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={() => dec(p.id)}
                  className="h-10 w-10 rounded-lg border font-bold"
                  disabled={qty === 0}
                >
                  −
                </button>

                <div className="w-10 text-center font-extrabold">{qty}</div>

                <button
                  onClick={() => inc(p.id, p.stockQty)}
                  className="h-10 w-10 rounded-lg border font-bold"
                  disabled={out || qty >= p.stockQty}
                >
                  +
                </button>

                <button
                  onClick={() => commitAdd(p)}
                  disabled={out || qty <= 0}
                  className="ml-auto rounded-xl bg-black px-4 py-2 font-bold text-white disabled:opacity-60"
                >
                  Toevoegen aan winkelmand
                </button>
              </div>

              {out ? (
                <div className="mt-3 rounded-lg border p-3 text-sm font-semibold opacity-70">
                  Uitverkocht
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* MODAL */}
      {addedModal.open && (
        <div className="fixed inset-0 z-[80]">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setAddedModal({ open: false })}
            aria-hidden="true"
          />
          <div className="absolute left-1/2 top-1/2 w-[92%] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-xl">
            <div className="text-lg font-black">Toegevoegd ✅</div>
            <div className="mt-2 text-sm opacity-80">
              {addedModal.lastName ? <b>{addedModal.lastName}</b> : "Product"} zit in je winkelmand.
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2">
              <button
                onClick={() => setAddedModal({ open: false })}
                className="rounded-xl border px-4 py-3 font-bold"
              >
                Verder winkelen
              </button>

              <button
                onClick={() => (window.location.href = "/cart")}
                className="rounded-xl bg-black px-4 py-3 font-bold text-white"
              >
                Ga naar winkelmand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
