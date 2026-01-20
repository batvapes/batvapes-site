"use client";

import { useEffect, useMemo, useState } from "react";

type Order = {
  id: string;
  createdAt: string;
  snapchat: string;
  municipality: string;
  deliveryDay: string;
  isCompleted: boolean;
  note?: string | null;
  totalCents: number;
  items: { id: string; quantity: number; priceCents: number; product: { name: string } }[];
};

type ApiResponse = {
  orders: Order[];
  filters: { municipalities: string[]; days: string[] };
};

export default function OrdersAdminClient() {
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [municipalities, setMunicipalities] = useState<string[]>([]);
  const [days, setDays] = useState<string[]>([]);

  const [municipality, setMunicipality] = useState("");
  const [day, setDay] = useState("");
  const [status, setStatus] = useState<"all" | "open" | "done">("all");

  async function load() {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (municipality) qs.set("municipality", municipality);
      if (day) qs.set("day", day);
      if (status !== "all") qs.set("status", status);

      const res = await fetch(`/api/admin/orders?${qs.toString()}`, { cache: "no-store" });
      const data: ApiResponse = await res.json();

      if (!res.ok) throw new Error((data as any)?.error ?? "Kan orders niet laden");

      setOrders(data.orders ?? []);
      setMunicipalities(data.filters?.municipalities ?? []);
      setDays(data.filters?.days ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { load(); }, [municipality, day, status]);

  const openCount = useMemo(() => orders.filter((o) => !o.isCompleted).length, [orders]);
  const doneCount = useMemo(() => orders.filter((o) => o.isCompleted).length, [orders]);

  async function setCompleted(id: string, isCompleted: boolean) {
    setSavingId(id);
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, isCompleted } : o)));

    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Kon status niet opslaan");
    } catch {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, isCompleted: !isCompleted } : o)));
      alert("Fout bij opslaan. Probeer opnieuw.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr auto",
          gap: 12,
          alignItems: "end",
          marginBottom: 16,
        }}
      >
        <div>
          <label style={{ display: "block", fontSize: 12, marginBottom: 6 }}>Gemeente</label>
          <select
            value={municipality}
            onChange={(e) => setMunicipality(e.target.value)}
            style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
          >
            <option value="">Alle</option>
            {municipalities.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, marginBottom: 6 }}>Dag</label>
          <select
            value={day}
            onChange={(e) => setDay(e.target.value)}
            style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
          >
            <option value="">Alle</option>
            {days.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, marginBottom: 6 }}>Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
          >
            <option value="all">Alles</option>
            <option value="open">Open</option>
            <option value="done">Afgevinkt</option>
          </select>
        </div>

        <button
          onClick={load}
          style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #ddd", background: "white" }}
          disabled={loading}
        >
          Vernieuwen
        </button>
      </div>

      <div style={{ marginBottom: 10, fontSize: 13, opacity: 0.8 }}>
        Open: <b>{openCount}</b> — Afgevinkt: <b>{doneCount}</b>
      </div>

      {loading ? (
        <div style={{ padding: 16 }}>Laden…</div>
      ) : orders.length === 0 ? (
        <div style={{ padding: 16 }}>Geen bestellingen gevonden.</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {orders.map((o) => (
            <div
              key={o.id}
              style={{
                border: "1px solid #e5e5e5",
                borderRadius: 14,
                padding: 14,
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                gap: 12,
                alignItems: "start",
                opacity: o.isCompleted ? 0.65 : 1,
              }}
            >
              <input
                type="checkbox"
                checked={o.isCompleted}
                onChange={(e) => setCompleted(o.id, e.target.checked)}
                disabled={savingId === o.id}
                style={{ width: 18, height: 18, marginTop: 6 }}
              />

              <div>
                <div style={{ fontWeight: 800, marginBottom: 4 }}>
                  Snapchat: {o.snapchat}
                </div>

                <div style={{ fontSize: 13 }}>
                  <b>Gemeente:</b> {o.municipality}
                  <span style={{ margin: "0 8px", opacity: 0.5 }}>•</span>
                  <b>Dag:</b> {o.deliveryDay}
                  <span style={{ margin: "0 8px", opacity: 0.5 }}>•</span>
                  <b>Totaal:</b> €{(o.totalCents / 100).toFixed(2)}
                </div>

                <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                  Aangemaakt: {new Date(o.createdAt).toLocaleString()}
                </div>

                <div style={{ marginTop: 10, fontSize: 13 }}>
                  <b>Items:</b>
                  <div style={{ marginTop: 6, display: "grid", gap: 4 }}>
                    {o.items.map((it) => (
                      <div key={it.id}>
                        • {it.product.name} × {it.quantity} (€{(it.priceCents / 100).toFixed(2)})
                      </div>
                    ))}
                  </div>
                </div>

                {o.note ? (
                  <div style={{ marginTop: 10, fontSize: 13 }}>
                    <b>Opmerking:</b> {o.note}
                  </div>
                ) : null}
              </div>

              <div style={{ fontSize: 12, textAlign: "right", opacity: 0.7 }}>
                {o.isCompleted ? "✅ Afgevinkt" : "🕒 Open"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
