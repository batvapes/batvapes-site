"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import DeleteCustomerButton from "./DeleteCustomerButton";
import InviteButton from "./InviteButton";

type Customer = {
  id: string;
  snapchat?: string | null;
  personalCode?: string | null;
  referralCode?: string | null;
  referredByCode?: string | null;
  createdAt: string;
};

export default function CustomersAdminPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/customers", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error ?? "Kon klanten niet laden");
        setCustomers([]);
        return;
      }
      setCustomers(Array.isArray(data?.customers) ? data.customers : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return customers;
    return customers.filter((c) =>
      [c.snapchat, c.personalCode, c.referralCode, c.referredByCode]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(s)
    );
  }, [customers, q]);

  return (
    <div className="mx-auto max-w-6xl p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Klanten</h1>
        <button onClick={load} className="rounded-xl border bg-black px-4 py-2 font-bold text-white">
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-xl border p-3">
          <label className="mb-2 block font-semibold">Zoeken</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Snapchat, code…"
            className="w-full rounded-lg border p-2"
          />
        </div>

        <div className="rounded-xl border p-3">
          <InviteButton />
        </div>
      </div>

      {loading ? <p className="mt-4">Laden…</p> : null}

      {/* MOBILE: cards */}
      <div className="mt-4 grid grid-cols-1 gap-3 lg:hidden">
        {filtered.map((c) => (
          <div key={c.id} className="rounded-xl border bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm opacity-70 font-mono">{c.id.slice(0, 8)}…</div>
                <div className="text-lg font-bold">{c.snapchat ?? "-"}</div>
                <div className="text-sm opacity-80 mt-1">
                  <b>Personal:</b> {c.personalCode ?? "-"} • <b>Referral:</b> {c.referralCode ?? "-"}
                </div>
                <div className="text-sm opacity-80 mt-1">
                  <b>Referred by:</b> {c.referredByCode ?? "-"}
                </div>
                <div className="text-xs opacity-70 mt-2">
                  {new Date(c.createdAt).toLocaleString("nl-BE")}
                </div>
              </div>

              <div className="shrink-0 flex flex-col gap-2">
                <Link
                  href={`/dashboard/customers/${c.id}/edit`}
                  className="rounded-lg border px-3 py-2 font-bold hover:bg-gray-100 text-center"
                >
                  Bewerk
                </Link>
                <DeleteCustomerButton id={c.id} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* DESKTOP: table */}
      <div className="mt-4 hidden lg:block overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="p-3 text-left">Snapchat</th>
              <th className="p-3 text-left">Personal</th>
              <th className="p-3 text-left">Referral</th>
              <th className="p-3 text-left">Referred by</th>
              <th className="p-3 text-left">Created</th>
              <th className="p-3 text-right">Acties</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b last:border-b-0">
                <td className="p-3">{c.snapchat ?? "-"}</td>
                <td className="p-3">{c.personalCode ?? "-"}</td>
                <td className="p-3">{c.referralCode ?? "-"}</td>
                <td className="p-3">{c.referredByCode ?? "-"}</td>
                <td className="p-3">{new Date(c.createdAt).toLocaleString("nl-BE")}</td>
                <td className="p-3 text-right whitespace-nowrap">
                  <Link
                    href={`/dashboard/customers/${c.id}/edit`}
                    className="rounded-lg border px-3 py-1 font-bold hover:bg-gray-100"
                  >
                    Bewerk
                  </Link>
                  <DeleteCustomerButton id={c.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!loading && filtered.length === 0 ? (
        <div className="mt-4 rounded-xl border p-4 opacity-70">Geen klanten gevonden.</div>
      ) : null}
    </div>
  );
}
