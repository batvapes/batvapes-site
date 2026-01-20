"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteCustomerButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const ok = confirm("Ben je zeker dat je deze klant wil verwijderen?");
    if (!ok) return;

    setLoading(true);
    const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
    setLoading(false);

    if (!res.ok) {
      const txt = await res.text();
      alert(txt || "Verwijderen mislukt");
      return;
    }

    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="ml-2 px-3 py-1 border rounded hover:bg-red-100 disabled:opacity-50"
    >
      {loading ? "..." : "Verwijder"}
    </button>
  );
}
