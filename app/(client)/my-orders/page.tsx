"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDeliveryDateLabel } from "@/lib/orderRules";

type OrderItem = {
  id: string;
  quantity: number;
  priceCents: number;
  product: { id: string; name: string };
};

type Order = {
  id: string;
  createdAt: string;
  municipality: string;
  deliveryDay: string;
  note?: string | null;
  totalCents: number;
  isCompleted: boolean;
  items: OrderItem[];
};

const eur = (c: number) => `€${(c / 100).toFixed(2)}`;

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("nl-BE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/my-orders", { cache: "no-store", credentials: "include" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          alert(data?.error ?? "Kon bestellingen niet laden");
          setOrders([]);
          return;
        }
        setOrders(Array.isArray(data?.orders) ? data.orders : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const open = useMemo(() => orders.filter((o) => !o.isCompleted), [orders]);
  const done = useMemo(() => orders.filter((o) => o.isCompleted), [orders]);

  return (
    <div className="mx-auto max-w-6xl p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Mijn bestellingen</h1>
        <span className="rounded-full border px-3 py-1 text-sm font-semibold">
          {orders.length}
        </span>
      </div>

      {loading ? <p>Laden…</p> : null}

      {!loading && (
        <div className="space-y-6">
          <Section title="Open" count={open.length}>
            <OrdersList orders={open} />
          </Section>

          <Section title="Afgewerkt" count={done.length}>
            <OrdersList orders={done} />
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-bold">{title}</h2>
        <span className="rounded-full border px-3 py-1 text-sm font-semibold">{count}</span>
      </div>
      {children}
    </section>
  );
}

function OrdersList({ orders }: { orders: Order[] }) {
  if (!orders.length) return <p className="opacity-70">Geen resultaten.</p>;

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {orders.map((o) => (
        <div key={o.id} className="rounded-xl border bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-bold">
                {o.isCompleted ? "✅ Afgewerkt" : "🕒 In behandeling"}
              </div>
              <div className="text-sm opacity-70">{fmtDate(o.createdAt)}</div>
              <div className="mt-1 text-sm">
                <b>Gemeente:</b> {o.municipality} • <b>Dag:</b>{" "}
                {formatDeliveryDateLabel(o.deliveryDay)}
              </div>
              {o.note ? (
                <div className="mt-2 rounded-lg border p-3 text-sm">
                  <b>Opmerking:</b> {o.note}
                </div>
              ) : null}
            </div>

            <div className="text-right">
              <div className="text-lg font-extrabold">{eur(o.totalCents)}</div>
              <div className="text-xs opacity-70 font-mono">
                {o.id.slice(0, 8)}…
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 font-bold">Items</div>
            <div className="space-y-1 text-sm">
              {o.items.map((it) => (
                <div key={it.id} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate">
                    {it.product.name} × {it.quantity}
                  </span>
                  <b className="shrink-0">{eur(it.priceCents * it.quantity)}</b>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-lg border p-3">
            <span className="font-bold">Totaal</span>
            <span className="font-extrabold">{eur(o.totalCents)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
