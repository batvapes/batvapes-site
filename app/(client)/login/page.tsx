"use client";

import { useState } from "react";

export default function LoginPage() {
  const [tab, setTab] = useState<"customer" | "admin">("customer");

  const [snapchat, setSnapchat] = useState("");
  const [custPassword, setCustPassword] = useState("");

  const [username, setUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [loading, setLoading] = useState(false);

  async function loginCustomer() {
    if (!snapchat || !custPassword) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapchat, password: custPassword }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error ?? "Login mislukt");
        return;
      }

      window.location.href = "/shop";
    } finally {
      setLoading(false);
    }
  }

  async function loginAdmin() {
    if (!username || !adminPassword) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password: adminPassword }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error ?? "Login mislukt");
        return;
      }

      window.location.href = "/dashboard/customers";
    } finally {
      setLoading(false);
    }
  }

  const tabBtn =
    "px-6 py-2 rounded-full font-extrabold border-2 transition";
  const tabInactive =
    "bg-black text-[#FFD700] border-[#FFD700] hover:bg-[#0f0f0f]";
  const tabActive =
    "bg-black text-[#FFD700] border-[#FFD700] shadow-[0_0_18px_rgba(255,215,0,0.18)]";

  const submitBtn =
    "w-full mt-1 rounded-full border-2 border-[#FFD700] bg-black text-[#FFD700] font-extrabold py-3 transition hover:bg-[#0f0f0f] hover:shadow-[0_0_18px_rgba(255,215,0,0.15)] disabled:opacity-50";

  return (
    <div className="min-h-screen bg-black px-4 pt-20">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-center text-3xl font-black text-[#FFD700] mb-8">
          Inloggen
        </h1>

        {/* Tabs altijd zichtbaar */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            type="button"
            onClick={() => setTab("customer")}
            className={`${tabBtn} ${tab === "customer" ? tabActive : tabInactive}`}
          >
            Klant
          </button>

          <button
            type="button"
            onClick={() => setTab("admin")}
            className={`${tabBtn} ${tab === "admin" ? tabActive : tabInactive}`}
          >
            Admin
          </button>
        </div>

        {/* Inputs blijven wit met zwarte tekst */}
        {tab === "customer" ? (
          <div className="space-y-4">
            <input
              placeholder="Snapchat"
              value={snapchat}
              onChange={(e) => setSnapchat(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white p-3 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
            />

            <input
              placeholder="Wachtwoord"
              type="password"
              value={custPassword}
              onChange={(e) => setCustPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white p-3 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
            />

            <button
              type="button"
              onClick={loginCustomer}
              disabled={loading || !snapchat || !custPassword}
              className={submitBtn}
            >
              {loading ? "Even..." : "Inloggen"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white p-3 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
            />

            <input
              placeholder="Wachtwoord"
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white p-3 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
            />

            <button
              type="button"
              onClick={loginAdmin}
              disabled={loading || !username || !adminPassword}
              className={submitBtn}
            >
              {loading ? "Even..." : "Inloggen"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
