"use client";

import { useEffect, useMemo, useState } from "react";
import GemeenteSelect from "../../../components/GemeenteSelect";
import { getDeliveryDateOptions, formatDeliveryDateLabel } from "../../../../lib/orderRules";

type OrderItem = {
  id: string;
  quantity: number;
  priceCents: number;
  product: { id: string; name: string };
};

type Order = {
  id: string;
  createdAt: string;
  snapchat: string;
  municipality: string;
  deliveryDay: string;
  isCompleted: boolean;
  note?: string | null;
  totalCents: number;
  items: OrderItem[];
};

type ApiResponse = {
  orders: Order[];
};

const eur = (cents: number) => `€${(cents / 100).toFixed(2)}`;

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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [municipality, setMunicipality] = useState("");
  const [deliveryDay, setDeliveryDay] = useState("");
  const [status, setStatus] = useState<"" | "open" | "done">("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const openOrders = useMemo(() => orders.filter((o) => !o.isCompleted), [orders]);
  const doneOrders = useMemo(() => orders.filter((o) => o.isCompleted), [orders]);

  async function load() {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (municipality) qs.set("municipality", municipality);
      if (deliveryDay) qs.set("deliveryDay", deliveryDay);
      if (status) qs.set("status", status);

      const res = await fetch(`/api/admin/orders?${qs.toString()}`, { cache: "no-store" });
      const data: ApiResponse = await res.json();

      if (!res.ok) {
        alert((data as any)?.error ?? "Kan orders niet laden");
        return;
      }

      setOrders(data.orders ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleCompleted(orderId: string, nextValue: boolean) {
    setTogglingId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: nextValue }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        alert(data?.error ?? "Kon status niet wijzigen");
        return;
      }

      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, isCompleted: nextValue } : o)));
      await load();
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Bestellingen</h1>

        <button
          onClick={load}
          className="rounded-xl border bg-black px-4 py-2 font-bold text-white"
        >
          Refresh
        </button>
      </div>

      {/* FILTERS - mobile first */}
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 lg:items-end">
        <div className="rounded-xl border p-3">
          <GemeenteSelect
            label="Filter gemeente"
            value={municipality}
            onChange={setMunicipality}
            includeAllOption
            allOptionLabel="Alle gemeentes"
            allowCustom
          />
        </div>

        <div className="rounded-xl border p-3">
          <label className="mb-2 block font-semibold">Filter leverdag</label>
          <select
            value={deliveryDay}
            onChange={(e) => setDeliveryDay(e.target.value)}
            className="w-full rounded-lg border p-2"
          >
            <option value="">Alle leverdagen</option>
            {getDeliveryDateOptions(new Date(), 60)
              .filter((x) => !x.disabled)
              .map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
          </select>
        </div>

        <div className="rounded-xl border p-3">
          <label className="mb-2 block font-semibold">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="w-full rounded-lg border p-2"
          >
            <option value="">Alle</option>
            <option value="open">Open</option>
            <option value="done">Afgewerkt</option>
          </select>
        </div>

        <button
          onClick={load}
          className="rounded-xl border bg-black px-4 py-3 font-bold text-white"
        >
          Filter
        </button>
      </div>

      {loading ? <p>Laden…</p> : null}

      {!loading && (
        <div className="space-y-6">
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-bold">Open</h2>
              <span className="rounded-full border px-3 py-1 text-sm font-semibold">
                {openOrders.length}
              </span>
            </div>
            <OrdersGrid
              orders={openOrders}
              togglingId={togglingId}
              onToggleCompleted={toggleCompleted}
            />
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-bold">Afgewerkt</h2>
              <span className="rounded-full border px-3 py-1 text-sm font-semibold">
                {doneOrders.length}
              </span>
            </div>
            <OrdersGrid
              orders={doneOrders}
              togglingId={togglingId}
              onToggleCompleted={toggleCompleted}
            />
          </section>
        </div>
      )}
    </div>
  );
}

function OrdersGrid({
  orders,
  togglingId,
  onToggleCompleted,
}: {
  orders: Order[];
  togglingId: string | null;
  onToggleCompleted: (orderId: string, nextValue: boolean) => Promise<void>;
}) {
  if (!orders.length) return <p className="opacity-70">Geen resultaten.</p>;

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {orders.map((o) => {
        const busy = togglingId === o.id;

        return (
          <div key={o.id} className="rounded-xl border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-mono text-xs opacity-70">{o.id}</div>
                <div className="text-sm opacity-70">{fmtDate(o.createdAt)}</div>
              </div>

              <label className="flex items-center gap-2 rounded-lg border px-3 py-2">
                <input
                  type="checkbox"
                  className="h-5 w-5"
                  checked={o.isCompleted}
                  disabled={busy}
                  onChange={(e) => onToggleCompleted(o.id, e.target.checked)}
                />
                <span className="font-semibold">Afgewerkt{busy ? "…" : ""}</span>
              </label>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Info label="Snapchat" value={o.snapchat} />
              <Info label="Gemeente" value={o.municipality} />
              <Info label="Dag" value={formatDeliveryDateLabel(o.deliveryDay)} />
            </div>

            {o.note ? (
              <div className="mt-3 rounded-lg border p-3 text-sm">
                <b>Note:</b> {o.note}
              </div>
            ) : null}

            <div className="mt-4">
              <div className="mb-2 font-bold">Items</div>
              <div className="space-y-1 text-sm">
                {o.items.map((it) => (
                  <div key={it.id} className="flex justify-between gap-3">
                    <span className="min-w-0 truncate">
                      {it.product.name} × {it.quantity}
                    </span>
                    <b className="shrink-0">{eur(it.quantity * it.priceCents)}</b>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-lg border p-3">
              <span className="font-bold">Totaal</span>
              <span className="font-extrabold">{eur(o.totalCents)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs font-semibold opacity-70">{label}</div>
      <div className="truncate font-bold">{value}</div>
    </div>
  );
}
