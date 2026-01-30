"use client";

import { useEffect, useMemo, useState } from "react";
import { readCart, setQty, clearCart, type CartLine } from "@/lib/cartStorage";
import GemeenteSelect from "@/app/components/GemeenteSelect";
import DaySelect from "@/app/components/DaySelect";
import TimeSlotSelect from "@/app/components/TimeSlotSelect";
import { getDeliveryDateOptions, type DeliveryDateISO } from "@/lib/orderRules";

type Product = {
  id: string;
  name: string;
  priceCents: number;
  isActive: boolean;
  stockQty: number;
};

const eur = (c: number) => `€${(c / 100).toFixed(2)}`;

export default function CartPage() {
  const [cart, setCartState] = useState<CartLine[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [snapchat, setSnapchat] = useState("");
  const [snapchatLocked, setSnapchatLocked] = useState(false);

  const [municipality, setMunicipality] = useState("");
  const [deliveryDay, setDeliveryDay] = useState<DeliveryDateISO | "">("");
  const [deliveryStartMinutes, setDeliveryStartMinutes] = useState<number | null>(null);

  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function refreshCartFromStorage() {
    setCartState(readCart());
  }

  useEffect(() => {
    refreshCartFromStorage();
  }, []);

  useEffect(() => {
    if (deliveryDay) return;
    const opts = getDeliveryDateOptions(new Date(), 21);
    const firstAvailable = opts.find((o) => !o.disabled)?.value;
    if (firstAvailable) setDeliveryDay(firstAvailable);
  }, [deliveryDay]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const pRes = await fetch("/api/products?all=1", { cache: "no-store" });
        const pData = await pRes.json().catch(() => ({}));
        const list = Array.isArray(pData?.products) ? pData.products : [];
        setProducts(list);

        const me = await fetch("/api/auth/customer/me", {
          cache: "no-store",
          credentials: "include",
        }).then((r) => r.json());

        const s = me?.customer?.snapchat ?? me?.snapchat ?? "";
        if (s) {
          setSnapchat(s);
          setSnapchatLocked(true);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // reset timeslot when day/municipality changes (TimeSlotSelect picks first available)
  useEffect(() => {
    setDeliveryStartMinutes(null);
  }, [deliveryDay, municipality]);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const lines = useMemo(() => {
    return cart
      .map((c) => {
        const p = byId.get(c.productId);
        if (!p) return null;
        return { ...c, product: p };
      })
      .filter(Boolean) as Array<CartLine & { product: Product }>;
  }, [cart, byId]);

  const totalCents = useMemo(
    () => lines.reduce((sum, l) => sum + l.product.priceCents * l.quantity, 0),
    [lines]
  );

  function inc(id: string, max: number) {
    const cur = cart.find((c) => c.productId === id)?.quantity ?? 0;
    const next = Math.min(max, cur + 1);
    setQty(id, next);
    refreshCartFromStorage();
  }

  function dec(id: string) {
    const cur = cart.find((c) => c.productId === id)?.quantity ?? 0;
    const next = Math.max(0, cur - 1);
    setQty(id, next);
    refreshCartFromStorage();
  }

  async function placeOrder() {
    if (!snapchat.trim() || !municipality.trim() || !deliveryDay) {
      return alert("Vul Snapchat, gemeente en dag in.");
    }
    if (deliveryStartMinutes === null) {
      return alert("Kies een tijdslot.");
    }
    if (lines.length === 0) return alert("Je winkelmand is leeg.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          snapchat: snapchat.trim(),
          municipality: municipality.trim(),
          deliveryDay,
          deliveryStartMinutes,
          note: note?.trim() ? note.trim() : null,
          items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        }),
      });

      const d = await res.json().catch(() => ({}));
      if (!res.ok) return alert(d?.error ?? "Fout bij bestellen");

      clearCart();
      refreshCartFromStorage();
      alert("Bestelling geplaatst ✅");
      window.location.href = "/my-orders";
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h1 className="text-xl font-black">Winkelmand</h1>
        <button
          onClick={() => (window.location.href = "/shop")}
          className="rounded-xl border px-4 py-2 font-bold"
        >
          Verder winkelen
        </button>
      </div>

      {loading ? <p>Laden…</p> : null}

      {!loading && lines.length === 0 ? (
        <div className="rounded-xl border bg-white p-4 opacity-70">Je winkelmand is leeg.</div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        {/* ITEMS */}
        <div className="space-y-3">
          {lines.map((l) => {
            const p = l.product;
            const out = p.stockQty <= 0;

            return (
              <div key={l.productId} className="rounded-xl border bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-bold text-lg truncate">{p.name}</div>
                    <div className="text-sm opacity-70">{eur(p.priceCents)}</div>
                    <div className="text-xs opacity-60 mt-1">Stock: {p.stockQty}</div>
                  </div>

                  <div className="text-right font-extrabold">
                    {eur(p.priceCents * l.quantity)}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => dec(l.productId)}
                    className="h-10 w-10 rounded-lg border font-bold"
                    disabled={l.quantity <= 0}
                  >
                    −
                  </button>

                  <div className="w-10 text-center font-extrabold">{l.quantity}</div>

                  <button
                    onClick={() => inc(l.productId, p.stockQty)}
                    className="h-10 w-10 rounded-lg border font-bold"
                    disabled={out || l.quantity >= p.stockQty}
                  >
                    +
                  </button>

                  <button
                    onClick={() => {
                      setQty(l.productId, 0);
                      refreshCartFromStorage();
                    }}
                    className="ml-auto rounded-xl border px-4 py-2 font-bold"
                  >
                    Verwijder
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* CHECKOUT */}
        <div className="lg:sticky lg:top-4">
          <div className="rounded-xl border bg-white p-4 space-y-3">
            <div className="flex items-center justify-between font-bold border-b pb-2">
              <span>Totaal</span>
              <span>{eur(totalCents)}</span>
            </div>

            <input
              className="w-full rounded-lg border p-2"
              placeholder="Snapchat"
              value={snapchat}
              disabled={snapchatLocked}
              onChange={(e) => setSnapchat(e.target.value)}
            />

            <GemeenteSelect value={municipality} onChange={setMunicipality} />

            <DaySelect
              value={deliveryDay}
              onChange={(v) => setDeliveryDay(v)}
              daysAhead={21}
            />

            <TimeSlotSelect
              deliveryDay={deliveryDay || ""}
              municipality={municipality}
              value={deliveryStartMinutes}
              onChange={(v) => setDeliveryStartMinutes(v)}
            />

            <input
              className="w-full rounded-lg border p-2"
              placeholder="Opmerking (optioneel)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            <button
              onClick={placeOrder}
              disabled={submitting || lines.length === 0}
              className="w-full rounded-xl bg-black py-3 font-bold text-white disabled:opacity-60"
            >
              {submitting ? "Bezig…" : "Bestelling plaatsen"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
