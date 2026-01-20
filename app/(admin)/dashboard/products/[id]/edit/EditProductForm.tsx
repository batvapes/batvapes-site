"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ProductLike = {
  id: string;
  name: string;
  priceCents: number;
  stockQty: number;
  isActive: boolean;
};

export default function EditProductForm({ product }: { product: ProductLike }) {
  const router = useRouter();
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState((product.priceCents / 100).toFixed(2));
  const [stockQty, setStockQty] = useState(String(product.stockQty));
  const [isActive, setIsActive] = useState(product.isActive);
  const [loading, setLoading] = useState(false);

  function toCents(v: string) {
    const normalized = v.replace(",", ".").trim();
    const n = Number(normalized);
    return Math.round(n * 100);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        priceCents: toCents(price),
        stockQty: Number(stockQty),
        isActive,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      alert(await res.text());
      return;
    }

    router.push("/dashboard/products");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="max-w-lg space-y-3">
      <h1 className="text-2xl font-bold">Product bewerken</h1>

      <input
        className="w-full border rounded p-2"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        className="w-full border rounded p-2"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />

      <input
        className="w-full border rounded p-2"
        value={stockQty}
        onChange={(e) => setStockQty(e.target.value)}
        placeholder="Stock"
      />

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        Actief
      </label>

      <button
        disabled={loading}
        className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50"
      >
        {loading ? "Opslaan..." : "Opslaan"}
      </button>
    </form>
  );
}
