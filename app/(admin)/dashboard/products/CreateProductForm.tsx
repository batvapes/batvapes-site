"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateProductForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("10.00");
  const [stockQty, setStockQty] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  function toCents(v: string) {
    const normalized = v.replace(",", ".").trim();
    const n = Number(normalized);
    return Math.round(n * 100);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/products", {
      method: "POST",
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

    setName("");
    setPrice("10.00");
    setStockQty("0");
    setIsActive(true);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="border rounded p-4 space-y-3 max-w-lg">
      <div className="font-semibold">Nieuw product</div>

      <input
        className="w-full border rounded p-2"
        placeholder="Naam (bv. Vape 600 puffs)"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        className="w-full border rounded p-2"
        placeholder="Prijs (bv. 10.00)"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />

      <input
        className="w-full border rounded p-2"
        placeholder="Stock (bv. 25)"
        value={stockQty}
        onChange={(e) => setStockQty(e.target.value)}
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
        {loading ? "..." : "Toevoegen"}
      </button>
    </form>
  );
}
