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
  if (s === "CLOTHING") return "KLEDIJ";
  return null;
}

export default function CategoryProductsPage() {
  const params = useParams();

  const category = useMemo<ProductCategory | null>(() => {
    const raw = (params as any)?.category;
    const value = Array.isArray(raw) ? raw[0] : raw;
    return normalizeCategory(value);
  }, [params]);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // per product: gekozen aantal (nog NIET toegevoegd)
  const [picked, setPicked] = useState<Record<string, number>>({});

  const [addedModal, setAddedModal] = useState<{
    open: boolean;
    countProducts?: number;
    totalItems?: number;
  }>({ open: false });

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

  const selection = useMemo(() => {
    let countProducts = 0;
    let totalItems = 0;
    let totalCents = 0;

    for (const p of visible) {
      const qty = picked[p.id] ?? 0;
      if (qty > 0) {
        countProducts += 1;
        totalItems += qty;
        totalCents += qty * p.priceCents;
      }
    }

    return { countProducts, totalItems, totalCents };
  }, [visible, picked]);

  function addAllToCart() {
    // voeg enkel producten toe met qty > 0
    let countProducts = 0;
    let totalItems = 0;

    for (const p of visible) {
      const qty = picked[p.id] ?? 0;
      if (qty > 0) {
        addToCart(p.id, qty);
        countProducts += 1;
        totalItems += qty;
      }
    }

    if (countProducts === 0) return;

    // reset alle gekozen hoeveelheden
    setPicked((prev) => {
      const next = { ...prev };
      for (const p of visible) {
        if ((next[p.id] ?? 0) > 0) next[p.id] = 0;
      }
      return next;
    });

    setAddedModal({ open: true, countProducts, totalItems });
  }

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
    <div className="mx-auto max-w-6xl p-4 pb-28">
      {/* TOP BAR */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link href="/shop" className="rounded-xl border px-4 py-2 font-bold bg-white">
          ← Categorieën
        </Link>

        <div className="flex-1" />

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

      {/* PRODUCT LIST */}
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

                {out ? (
                  <div className="ml-auto rounded-lg border px-3 py-2 text-sm font-semibold opacity-70">
                    Uitverkocht
                  </div>
                ) : (
                  <div className="ml-auto text-sm opacity-70">
                    Subtotaal: <b>{eur(qty * p.priceCents)}</b>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* STICKY BOTTOM BAR (1 knop voor alles) */}
      <div className="fixed bottom-0 left-0 right-0 z-[60] border-t bg-white">
        <div className="mx-auto max-w-6xl p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="text-sm">
            <div className="font-bold">
              Geselecteerd: {selection.countProducts} producten • {selection.totalItems} stuks
            </div>
            <div className="opacity-70">Totaal: {eur(selection.totalCents)}</div>
          </div>

          <div className="flex-1" />

          <button
            onClick={addAllToCart}
            disabled={selection.totalItems <= 0}
            className="rounded-xl bg-black px-5 py-3 font-bold text-white disabled:opacity-60"
          >
            Alles toevoegen aan winkelmand
          </button>

          <button
            onClick={() => (window.location.href = "/cart")}
            className="rounded-xl border px-5 py-3 font-bold"
          >
            Naar winkelmand
          </button>
        </div>
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
              <b>{addedModal.countProducts ?? 0}</b> producten toegevoegd • <b>{addedModal.totalItems ?? 0}</b> stuks.
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
