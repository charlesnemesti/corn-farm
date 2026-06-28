"use client";

import { useState } from "react";
import { usePlayMode } from "@/context/PlayModeProvider";
import { TreasuryPanel } from "@/components/game/TreasuryPanel";
import { useTreasuryLaunchStatus } from "@/hooks/useTreasuryLaunchStatus";

// Header entry point for the on-chain treasury.
export function TreasuryControls() {
  const { playMode, walletConnected } = usePlayMode();
  const { launchPending } = useTreasuryLaunchStatus();
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
            ? launchPending
              ? "Treasury opens right after $CORN launch"
              : walletConnected
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
