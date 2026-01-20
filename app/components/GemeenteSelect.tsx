// src/components/GemeenteSelect.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { GEMEENTEN, normalizeText } from "@/lib/orderConfig";

type Props = {
  label?: string;
  value: string;
  onChange: (val: string) => void;

  // admin filters
  includeAllOption?: boolean;
  allOptionLabel?: string;

  // klant
  placeholder?: string;

  // custom toelaten
  allowCustom?: boolean;
};

export default function GemeenteSelect({
  label = "Gemeente",
  value,
  onChange,
  includeAllOption = false,
  allOptionLabel = "Alle gemeentes",
  placeholder = "Kies je gemeente",
  allowCustom = true,
}: Props) {
  const presets = useMemo(() => [...GEMEENTEN], []);
  const isPreset = value ? presets.includes(value as any) : false;

  const [selectValue, setSelectValue] = useState<string>(() => {
    if (!value) return includeAllOption ? "__ALL__" : "";
    return isPreset ? value : "ANDERE";
  });

  const [customValue, setCustomValue] = useState<string>(() => {
    if (!value) return "";
    return isPreset ? "" : value;
  });

  useEffect(() => {
    if (!value) {
      setSelectValue(includeAllOption ? "__ALL__" : "");
      setCustomValue("");
      return;
    }
    const preset = presets.includes(value as any);
    setSelectValue(preset ? value : "ANDERE");
    setCustomValue(preset ? "" : value);
  }, [value, includeAllOption, presets]);

  function handleSelectChange(v: string) {
    setSelectValue(v);

    if (includeAllOption && v === "__ALL__") {
      setCustomValue("");
      onChange("");
      return;
    }

    if (allowCustom && v === "ANDERE") {
      onChange(normalizeText(customValue));
      return;
    }

    setCustomValue("");
    onChange(v);
  }

  function handleCustomChange(v: string) {
    const nv = normalizeText(v);
    setCustomValue(nv);
    if (selectValue === "ANDERE") onChange(nv);
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {label ? <label style={{ fontWeight: 600 }}>{label}</label> : null}

      <select
        value={selectValue}
        onChange={(e) => handleSelectChange(e.target.value)}
        style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
      >
        {includeAllOption ? (
          <option value="__ALL__">{allOptionLabel}</option>
        ) : (
          <option value="">{placeholder}</option>
        )}

        {presets.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}

        {allowCustom && <option value="ANDERE">Andere (zelf invullen)</option>}
      </select>

      {allowCustom && selectValue === "ANDERE" && (
        <input
          value={customValue}
          onChange={(e) => handleCustomChange(e.target.value)}
          placeholder="Typ je gemeente"
          style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
        />
      )}
    </div>
  );
}
