"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteProductButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function del() {
    if (!confirm("Product verwijderen?")) return;

    setLoading(true);
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    setLoading(false);

    if (!res.ok) {
      alert(await res.text());
      return;
    }
    router.refresh();
  }

  return (
    <button
      onClick={del}
      disabled={loading}
      className="ml-2 px-3 py-1 border rounded hover:bg-red-100 disabled:opacity-50"
    >
      {loading ? "..." : "Verwijder"}
    </button>
  );
}
