"use client";

import { useEffect, useMemo, useState } from "react";
import { CATEGORIES, type ProductCategory } from "@/lib/productCategories";

type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  priceCents: number;
  stockQty: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

const eur = (c: number) => `€${(c / 100).toFixed(2)}`;

function toCents(v: string) {
  const normalized = v.replace(",", ".").trim();
  const n = Number(normalized);
  return Math.round(n * 100);
}

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);
  const [catFilter, setCatFilter] = useState<"" | ProductCategory>("");

  // create form
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ProductCategory>("VAPES");
  const [price, setPrice] = useState("10.00");
  const [stockQty, setStockQty] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error ?? "Kon producten niet laden");
        setProducts([]);
        return;
      }
      setProducts(Array.isArray(data?.products) ? data.products : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return products.filter((p) => {
      if (onlyActive && !p.isActive) return false;
      if (catFilter && p.category !== catFilter) return false;
      if (!s) return true;
      return p.name.toLowerCase().includes(s);
    });
  }, [products, q, onlyActive, catFilter]);

  async function updateProduct(
    id: string,
    patch: Partial<Pick<Product, "stockQty" | "isActive" | "category">>
  ) {
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error ?? "Opslaan mislukt");
        return;
      }
      const updated: Product = data.product;
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
    } finally {
      setSavingId(null);
    }
  }

  async function createProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return alert("Naam is verplicht");

    setCreating(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          category,
          priceCents: toCents(price),
          stockQty: Number(stockQty),
          isActive,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error ?? "Toevoegen mislukt");
        return;
      }

      setName("");
      setCategory("VAPES");
      setPrice("10.00");
      setStockQty("0");
      setIsActive(true);

      await load();
    } finally {
      setCreating(false);
    }
  }

  async function deleteProduct(id: string) {
    if (!confirm("Product verwijderen?")) return;

    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error ?? "Verwijderen mislukt");
        return;
      }
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Stock beheren</h1>
        <button onClick={load} className="rounded-xl border bg-black px-4 py-2 font-bold text-white">
          Refresh
        </button>
      </div>

      {/* CREATE */}
      <form onSubmit={createProduct} className="rounded-xl border bg-white p-4 grid gap-3 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <label className="mb-1 block text-sm font-semibold">Naam</label>
          <input
            className="w-full rounded-lg border p-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Product naam"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold">Categorie</label>
          <select
            className="w-full rounded-lg border p-2"
            value={category}
            onChange={(e) => setCategory(e.target.value as ProductCategory)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold">Prijs</label>
          <input
            className="w-full rounded-lg border p-2"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="10.00"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold">Stock</label>
          <input
            className="w-full rounded-lg border p-2"
            type="number"
            min={0}
            value={stockQty}
            onChange={(e) => setStockQty(e.target.value)}
          />
        </div>

        <div className="flex items-end justify-between gap-3">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Actief
          </label>

          <button
            disabled={creating}
            className="rounded-xl bg-black px-4 py-3 font-bold text-white disabled:opacity-60"
          >
            {creating ? "Bezig…" : "Toevoegen"}
          </button>
        </div>
      </form>

      {/* FILTERS */}
      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border p-3 bg-white">
          <label className="mb-2 block font-semibold">Zoeken</label>
          <input
            className="w-full rounded-lg border p-2"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="bv. blueberry"
          />
        </div>

        <div className="rounded-xl border p-3 bg-white">
          <label className="mb-2 block font-semibold">Categorie</label>
          <select
            className="w-full rounded-lg border p-2"
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value as any)}
          >
            <option value="">Alles</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <label className="rounded-xl border p-3 bg-white flex items-center gap-2 font-semibold">
          <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} />
          Alleen actieve producten
        </label>

        <div className="rounded-xl border p-3 bg-white flex items-center justify-between">
          <span className="font-semibold">Resultaten</span>
          <span className="rounded-full border px-3 py-1 text-sm font-semibold">{filtered.length}</span>
        </div>
      </div>

      {loading ? <p className="mt-4">Laden…</p> : null}

      {!loading && filtered.length === 0 ? (
        <div className="mt-4 rounded-xl border p-4 opacity-70 bg-white">Geen producten gevonden.</div>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
        {filtered.map((p) => {
          const busy = savingId === p.id;
          const catLabel = CATEGORIES.find((c) => c.value === p.category)?.label ?? p.category;

          return (
            <div key={p.id} className="rounded-xl border bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-lg truncate">{p.name}</div>
                  <div className="text-sm opacity-70">{eur(p.priceCents)} • {catLabel}</div>
                  <div className="text-xs opacity-60 mt-1">
                    Updated: {new Date(p.updatedAt).toLocaleString("nl-BE")}
                  </div>
                </div>

                <button
                  onClick={() => deleteProduct(p.id)}
                  disabled={busy}
                  className="rounded-xl border px-3 py-2 font-bold hover:bg-red-50 disabled:opacity-60"
                >
                  Verwijder
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border p-3">
                  <div className="text-xs font-semibold opacity-70">Stock</div>
                  <input
                    className="mt-1 w-full rounded-lg border p-2"
                    type="number"
                    min={0}
                    defaultValue={p.stockQty}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const v = Number((e.target as HTMLInputElement).value);
                        updateProduct(p.id, { stockQty: v });
                      }
                    }}
                    onBlur={(e) => {
                      const v = Number((e.target as HTMLInputElement).value);
                      if (Number.isFinite(v) && v !== p.stockQty) updateProduct(p.id, { stockQty: v });
                    }}
                  />
                </div>

                <div className="rounded-lg border p-3">
                  <div className="text-xs font-semibold opacity-70">Categorie</div>
                  <select
                    className="mt-1 w-full rounded-lg border p-2"
                    value={p.category}
                    disabled={busy}
                    onChange={(e) => updateProduct(p.id, { category: e.target.value as ProductCategory })}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="rounded-lg border p-3 flex items-center gap-2 font-semibold">
                  <input
                    type="checkbox"
                    checked={p.isActive}
                    onChange={(e) => updateProduct(p.id, { isActive: e.target.checked })}
                    disabled={busy}
                  />
                  Actief
                </label>
              </div>

              <div className="mt-3 rounded-lg border p-3 flex items-center justify-between">
                <span className="text-xs font-semibold opacity-70">Status</span>
                <span className="font-bold">{busy ? "Bezig…" : "OK"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
