"use client";

import { useEffect, useState } from "react";

export default function RegisterPage() {
  const [invite, setInvite] = useState("");
  const [snapchat, setSnapchat] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setInvite(params.get("invite") ?? "");
  }, []);

  async function createAccount() {
    if (!invite) return alert("Invite ontbreekt.");
    if (!snapchat.trim()) return alert("Snapchat is verplicht.");
    if (!password) return alert("Wachtwoord is verplicht.");
    if (password.length < 6) return alert("Wachtwoord moet minstens 6 tekens zijn.");
    if (password !== password2) return alert("Wachtwoorden komen niet overeen.");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/customer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite, snapchat, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error ?? "Registratie mislukt");
        return;
      }

      // ✅ cookie customerId wordt gezet in API -> meteen naar bestellen
      window.location.href = "/orders";
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Account aanmaken</h1>
      <p style={{ opacity: 0.8 }}>
        Invite: <b>{invite || "—"}</b>
      </p>

      <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
        <input
          placeholder="Snapchat username"
          value={snapchat}
          onChange={(e) => setSnapchat(e.target.value)}
          style={{ padding: 12, borderRadius: 10, border: "1px solid #ddd" }}
        />

        <input
          placeholder="Wachtwoord"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: 12, borderRadius: 10, border: "1px solid #ddd" }}
        />

        <input
          placeholder="Herhaal wachtwoord"
          type="password"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          style={{ padding: 12, borderRadius: 10, border: "1px solid #ddd" }}
        />

        <button
          onClick={createAccount}
          disabled={loading}
          style={{
            padding: 12,
            borderRadius: 10,
            border: "1px solid #ddd",
            background: "white",
            fontWeight: 800,
          }}
        >
          {loading ? "Bezig..." : "Account aanmaken"}
        </button>
      </div>
    </div>
  );
}
