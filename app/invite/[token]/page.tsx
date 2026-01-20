"use client";

import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

export default function InviteRegisterPage() {
  const params = useParams();

  const token = useMemo(() => {
    const raw = (params?.token as string) ?? "";
    return raw.trim();
  }, [params]);

  const [snapchat, setSnapchat] = useState("");
  const [personalCode, setPersonalCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCode, setSuccessCode] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/invite/${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ snapchat, personalCode }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setError(data?.error || `Fout ${res.status}`);
      setLoading(false);
      return;
    }

    setSuccessCode(data?.customer?.referralCode ?? null);
    setLoading(false);
  }

  if (successCode) {
    return (
      <main style={{ padding: "2rem", maxWidth: 520 }}>
        <h2>Registratie gelukt 🎉</h2>
        <p>
          Jouw referral code is: <b>{successCode}</b>
        </p>
      </main>
    );
  }

  return (
    <main style={{ padding: "2rem", maxWidth: 420 }}>
      <h2>Registratie</h2>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10, marginTop: 12 }}>
        <input
          placeholder="Snapchat"
          value={snapchat}
          onChange={(e) => setSnapchat(e.target.value)}
          required
        />

        <input
          placeholder="Persoonlijke code"
          value={personalCode}
          onChange={(e) => setPersonalCode(e.target.value)}
          required
        />

        {error && <div style={{ color: "red" }}>{error}</div>}

        <button type="submit" disabled={loading || !token}>
          {loading ? "Bezig..." : "Registreren"}
        </button>
      </form>
    </main>
  );
}
