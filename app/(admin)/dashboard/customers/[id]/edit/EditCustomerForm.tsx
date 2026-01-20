"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type CustomerLike = {
  id: string;
  snapchat: string;
  personalCode: string;
  referralCode: string;
  referredByCode: string | null;
};

export default function EditCustomerForm({ customer }: { customer: CustomerLike }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    snapchat: customer.snapchat ?? "",
    personalCode: customer.personalCode ?? "",
    referralCode: customer.referralCode ?? "",
    referredByCode: customer.referredByCode ?? "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch(`/api/customers/${customer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        snapchat: form.snapchat,
        personalCode: form.personalCode,
        referralCode: form.referralCode,
        referredByCode: form.referredByCode || null,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const txt = await res.text();
      alert(txt || "Opslaan mislukt");
      return;
    }

    router.push("/dashboard/customers");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <h1 className="text-2xl font-bold">Klant bewerken</h1>

      <input
        className="w-full border rounded p-2"
        placeholder="Snapchat"
        value={form.snapchat}
        onChange={(e) => setForm({ ...form, snapchat: e.target.value })}
      />

      <input
        className="w-full border rounded p-2"
        placeholder="Persoonlijke code"
        value={form.personalCode}
        onChange={(e) => setForm({ ...form, personalCode: e.target.value })}
      />

      <input
        className="w-full border rounded p-2"
        placeholder="Referral code"
        value={form.referralCode}
        onChange={(e) => setForm({ ...form, referralCode: e.target.value })}
      />

      <input
        className="w-full border rounded p-2"
        placeholder="Referred by"
        value={form.referredByCode}
        onChange={(e) => setForm({ ...form, referredByCode: e.target.value })}
      />

      <button
        disabled={loading}
        className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50"
      >
        {loading ? "Opslaan..." : "Opslaan"}
      </button>
    </form>
  );
}
