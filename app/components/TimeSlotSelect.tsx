"use client";

import { useEffect, useMemo, useState } from "react";

type Slot = {
  startMinutes: number;
  label: string;
  disabled: boolean;
  reason: string | null;
  remaining: number;
  existingStop: boolean;
};

export default function TimeSlotSelect({
  deliveryDay,
  municipality,
  value,
  onChange,
}: {
  deliveryDay: string;
  municipality: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 1) Fetch slots wanneer dag/gemeente verandert
  useEffect(() => {
    if (!deliveryDay || !municipality) {
      setSlots([]);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/delivery/slots?deliveryDay=${encodeURIComponent(
            deliveryDay
          )}&municipality=${encodeURIComponent(municipality)}`,
          { cache: "no-store" }
        );

        const data = await res.json().catch(() => ({}));

        if (cancelled) return;

        if (!res.ok) {
          setSlots([]);
          setError(data?.error ?? "Kon tijdsloten niet laden");
          return;
        }

        const list = Array.isArray(data?.slots) ? (data.slots as Slot[]) : [];
        setSlots(list);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [deliveryDay, municipality]);

  // 2) Auto-pick: zorg dat er altijd een echte value in state komt zodra slots geladen zijn
  useEffect(() => {
    if (!deliveryDay || !municipality) return;
    if (loading) return;
    if (!slots || slots.length === 0) return;

    const isValid =
      value !== null && slots.some((s) => s.startMinutes === value && !s.disabled);

    if (!isValid) {
      const first = slots.find((s) => !s.disabled);
      onChange(first ? first.startMinutes : null);
    }
  }, [deliveryDay, municipality, loading, slots, value, onChange]);

  const options = useMemo(() => {
    return slots.map((s) => {
      const extra =
        s.disabled && s.reason
          ? ` — ${s.reason}`
          : s.remaining < 3
          ? ` — ${s.remaining} plek(ken)`
          : "";
      const label = `${s.label}${extra}`;
      return { ...s, optionLabel: label };
    });
  }, [slots]);

  const disabledSelect =
    !deliveryDay || !municipality || loading || options.length === 0;

  return (
    <div className="space-y-1">
      <div className="text-sm font-bold">Tijdslot</div>

      {loading ? <div className="text-sm opacity-70">Tijdsloten laden…</div> : null}
      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      <select
        className="w-full rounded-lg border p-2"
        value={value ?? ""}
        onChange={(e) => {
          const raw = e.target.value;
          if (!raw) return onChange(null);
          const n = Number(raw);
          onChange(Number.isFinite(n) ? n : null);
        }}
        disabled={disabledSelect}
      >
        {/* Placeholder zodat je niet “per ongeluk” de eerste optie ziet terwijl state nog null is */}
        <option value="" disabled>
          Kies een tijdslot…
        </option>

        {options.map((s) => (
          <option key={s.startMinutes} value={s.startMinutes} disabled={s.disabled}>
            {s.optionLabel}
          </option>
        ))}
      </select>

      <div className="text-xs opacity-70">
        Max 3 bestellingen per tijdslot. Nieuwe stops kunnen enkel als ze nog in de route passen.
      </div>
    </div>
  );
}
