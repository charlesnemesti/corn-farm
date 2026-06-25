"use client";

import {
  getPackDropRateLines,
  RARITY_TEXT_CLASS,
} from "@/lib/seedConfig";

// Drop rate legend shown in pack shop and opening UI.
export function PackDropRatesInfo({ compact = false }: { compact?: boolean }) {
  const lines = getPackDropRateLines();

  return (
    <div
      className={`rounded-lg border border-white/10 bg-black/30 ${
        compact ? "p-2" : "p-3"
      }`}
    >
      <p
        className={`font-semibold text-white/80 ${
          compact ? "text-[10px]" : "text-[11px]"
        }`}
      >
        Drop rates per seed
      </p>
      <ul className={`mt-1.5 space-y-0.5 ${compact ? "text-[10px]" : "text-[11px]"}`}>
        {lines.map((line) => (
          <li
            key={line.rarity}
            className={`flex items-center justify-between gap-2 ${RARITY_TEXT_CLASS[line.rarity]}`}
          >
            <span>{line.label}</span>
            <span className="font-bold">{line.percent}%</span>
          </li>
        ))}
      </ul>
      <p className={`mt-1.5 text-white/45 ${compact ? "text-[9px]" : "text-[10px]"}`}>
        Each pack contains 3 seeds. Rates are independent per seed.
      </p>
    </div>
  );
}
