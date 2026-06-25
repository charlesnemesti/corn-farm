"use client";

import { useState } from "react";
import { usePlayMode } from "@/context/PlayModeProvider";
import { TreasuryPanel } from "@/components/game/TreasuryPanel";

// Header entry point for the on-chain treasury.
export function TreasuryControls() {
  const { playMode, walletConnected } = usePlayMode();
  const [open, setOpen] = useState(false);

  const walletMode = playMode === "wallet";
  const enabled = walletMode && walletConnected;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`h-9 rounded-lg border px-3 text-xs font-semibold transition sm:text-sm ${
          enabled
            ? "border-farm-sun/40 bg-farm-sun/15 text-farm-sun hover:bg-farm-sun/25"
            : "border-white/15 bg-white/5 text-white/55 hover:bg-white/10"
        }`}
        title={
          walletMode
            ? walletConnected
              ? "Deposit SOL or withdraw $CORN"
              : "Connect wallet to use treasury"
            : "Switch to wallet mode to use treasury"
        }
      >
        Treasury
      </button>

      <TreasuryPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}
