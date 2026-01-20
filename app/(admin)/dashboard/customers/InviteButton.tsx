"use client";

import { useEffect, useMemo, useState } from "react";

type InviteApiResponse =
  | { ok?: boolean; invite?: { token?: string; code?: string; expiresAt?: string } }
  | { ok?: boolean; token?: string; code?: string; expiresAt?: string }
  | { ok?: boolean; url?: string }
  | { ok?: boolean; path?: string }
  | any;

function safeOrigin() {
  // client-side only
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  // optional fallback als je die ooit zet
  const env = process.env.NEXT_PUBLIC_BASE_URL;
  return env && env.startsWith("http") ? env : "";
}

function buildInvitePath(data: InviteApiResponse): string | null {
  // 1) als API al een url terugstuurt
  if (typeof data?.url === "string" && data.url.trim()) return data.url.trim();

  // 2) als API een path terugstuurt
  if (typeof data?.path === "string" && data.path.trim()) return data.path.trim();

  // 3) token op verschillende plekken
  const token =
    (typeof data?.invite?.token === "string" && data.invite.token) ||
    (typeof data?.token === "string" && data.token) ||
    null;

  if (token) return `/invite/${token}`;

  // 4) code fallback (sommige setups gebruiken /r/<code> of /t/<code>)
  const code =
    (typeof data?.invite?.code === "string" && data.invite.code) ||
    (typeof data?.code === "string" && data.code) ||
    null;

  // kies 1 default route; jouw project heeft o.a. /r en /t folders,
  // maar invites zijn meestal /invite/<token>. Als je API alleen "code" geeft:
  if (code) return `/r/${code}`;

  return null;
}

export default function InviteButton() {
  const [origin, setOrigin] = useState("");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setOrigin(safeOrigin());
  }, []);

  const displayLink = useMemo(() => {
    if (!link) return "";
    // als API al volledige URL gaf (http...), toon die direct
    if (link.startsWith("http://") || link.startsWith("https://")) return link;
    // anders plak origin ervoor
    return `${origin}${link}`;
  }, [link, origin]);

  async function generate() {
    setBusy(true);
    try {
      // jouw project heeft zowel /api/invite als /api/invites.
      // We proberen eerst /api/invite, en als dat faalt, proberen we /api/invites.
      let res = await fetch("/api/invite", { method: "POST" }).catch(() => null);
      let data: InviteApiResponse = null;

      if (res) data = await res.json().catch(() => null);

      if (!res || !res.ok) {
        // fallback
        res = await fetch("/api/invites", { method: "POST" }).catch(() => null);
        if (res) data = await res.json().catch(() => null);
      }

      if (!res || !res.ok) {
        alert((data as any)?.error ?? "Kon invite link niet genereren");
        return;
      }

      const pathOrUrl = buildInvitePath(data);
      if (!pathOrUrl) {
        alert("Invite aangemaakt, maar ik kon geen token/path uit de API response halen.");
        console.log("Invite API response:", data);
        return;
      }

      setLink(pathOrUrl);

      // auto-copy
      const finalLink =
        pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")
          ? pathOrUrl
          : `${safeOrigin()}${pathOrUrl}`;

      try {
        await navigator.clipboard.writeText(finalLink);
      } catch {
        // ignore
      }
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!displayLink) return;
    try {
      await navigator.clipboard.writeText(displayLink);
      alert("Link gekopieerd!");
    } catch {
      alert("Kon niet kopiëren. Selecteer en kopieer handmatig.");
    }
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="font-semibold">Nieuwe 24u link genereren</div>
        <button
          type="button"
          onClick={copy}
          className="rounded-lg border px-3 py-1 font-bold"
          disabled={!displayLink}
        >
          Copy
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
        <input
          className="w-full rounded-lg border p-2 font-mono text-xs"
          value={displayLink}
          readOnly
          placeholder="Klik op genereren…"
        />

        <button
          type="button"
          onClick={generate}
          disabled={busy}
          className="rounded-xl bg-black px-4 py-2 font-bold text-white disabled:opacity-60"
        >
          {busy ? "Bezig…" : "Genereren"}
        </button>
      </div>

      {/* debug hint als origin nog leeg is */}
      {!origin ? (
        <div className="text-xs opacity-60">
          Tip: refresh de pagina als de link leeg blijft.
        </div>
      ) : null}
    </div>
  );
}
