"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

export default function ReferralRegistrationPage() {
  const { code } = useParams<{ code: string }>();

  const [fullName, setFullName] = useState("");
  const [snapchat, setSnapchat] = useState("");
  const [personalCode, setPersonalCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/referral/${code}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        snapchat,
        personalCode,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Fout opgetreden");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <main style={{ padding: "2rem" }}>
        <h2>Registratie gelukt 🎉</h2>
        <p>Je bent geregistreerd via code <b>{code}</b></p>
      </main>
    );
  }

  return (
    <main style={{ padding: "2rem", maxWidth: 420 }}>
      <h2>Registratie</h2>
      <p><strong>Referral code:</strong> {code}</p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
        <input placeholder="Naam" value={fullName} onChange={e => setFullName(e.target.value)} required />
        <input placeholder="Snapchat" value={snapchat} onChange={e => setSnapchat(e.target.value)} required />
        <input placeholder="Persoonlijke code" value={personalCode} onChange={e => setPersonalCode(e.target.value)} required />

        {error && <div style={{ color: "red" }}>{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? "Bezig..." : "Registreren"}
        </button>
      </form>
    </main>
  );
}
