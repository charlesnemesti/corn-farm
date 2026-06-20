"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useGame } from "@/context/GameProvider";

const DEBUG_CORN_AMOUNT = 5_000;
const DEBUG_XP_AMOUNT = 500;

// Dev-only helpers — visible with ?debug=1
export function DevDebugPanel() {
  const searchParams = useSearchParams();
  const shouldReset = searchParams.get("reset") === "1";
  const {
    hydrated,
    resetSavedGame,
    addDebugCorn,
    addDebugXp,
  } = useGame();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!shouldReset || !hydrated) return;
    resetSavedGame();
    setMessage("Save reset to a fresh game.");
    const url = new URL(window.location.href);
    url.searchParams.delete("reset");
    window.history.replaceState({}, "", url.toString());
  }, [hydrated, resetSavedGame, shouldReset]);

  const flash = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(null), 2000);
  };

  return (
    <div className="pointer-events-auto absolute bottom-4 left-4 z-[120] w-52 rounded-xl border border-violet-400/30 bg-black/90 p-3 text-white shadow-2xl backdrop-blur-sm">
      <p className="text-[10px] font-bold tracking-wide text-violet-300 uppercase">
        Dev tools
      </p>
      <div className="mt-2 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => {
            resetSavedGame();
            flash("Save reset.");
          }}
          className="rounded-md border border-red-500/40 bg-red-950/70 px-2 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-900/80"
        >
          Reset save
        </button>
        <button
          type="button"
          onClick={() => {
            addDebugCorn(DEBUG_CORN_AMOUNT);
            flash(`+${DEBUG_CORN_AMOUNT.toLocaleString("en-US")} $CORN`);
          }}
          className="rounded-md border border-farm-sun/40 bg-farm-sun/10 px-2 py-1.5 text-xs font-semibold text-farm-sun transition hover:bg-farm-sun/20"
        >
          +{DEBUG_CORN_AMOUNT.toLocaleString("en-US")} $CORN
        </button>
        <button
          type="button"
          onClick={() => {
            addDebugXp(DEBUG_XP_AMOUNT);
            flash(`+${DEBUG_XP_AMOUNT.toLocaleString("en-US")} XP`);
          }}
          className="rounded-md border border-blue-400/40 bg-blue-950/50 px-2 py-1.5 text-xs font-semibold text-blue-200 transition hover:bg-blue-900/60"
        >
          +{DEBUG_XP_AMOUNT.toLocaleString("en-US")} XP
        </button>
      </div>
      {message ? (
        <p className="mt-2 text-[10px] leading-snug text-white/70">{message}</p>
      ) : null}
    </div>
  );
}
