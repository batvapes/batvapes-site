// src/components/DaySelect.tsx
"use client";

import { useMemo } from "react";
import { type DeliveryDateISO, getDeliveryDateOptions } from "@/lib/orderRules";

type Props = {
  label?: string;
  value: DeliveryDateISO | "";
  onChange: (iso: DeliveryDateISO) => void;
  daysAhead?: number;
};

export default function DaySelect({ label = "Dag", value, onChange, daysAhead = 21 }: Props) {
  const options = useMemo(() => getDeliveryDateOptions(new Date(), daysAhead), [daysAhead]);

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {label && <label style={{ fontWeight: 600 }}>{label}</label>}

      <select
        value={value}
        onChange={(e) => onChange(e.target.value as DeliveryDateISO)}
        style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
            {opt.disabled ? " (niet beschikbaar)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
