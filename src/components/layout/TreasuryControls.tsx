"use client";

import { useState } from "react";
import { usePlayMode } from "@/context/PlayModeProvider";
import { TreasuryPanel } from "@/components/game/TreasuryPanel";

// Header entry point for the on-chain treasury.
export function TreasuryControls() {
  const { playMode, walletConnected } = usePlayMode();
  const [open, setOpen] = useState(false);

  const walletMode = playMode === "wallet";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hud-action-button shrink-0"
        title={
          walletMode
            ? walletConnected
              ? "Deposit or withdraw SPL $CORN"
              : "Connect wallet to use treasury"
            : "Demo mode — connect wallet to use treasury"
        }
      >
        <span className="hud-action-button__icon" aria-hidden>
          $
        </span>
        Treasury
      </button>

      <TreasuryPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}
