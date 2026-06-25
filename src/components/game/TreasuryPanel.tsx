"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTreasury } from "@/hooks/useTreasury";
import { formatCooldown } from "@/lib/treasuryConfig";

type TreasuryPanelProps = {
  open: boolean;
  onClose: () => void;
};

// Deposit / withdraw modal for the on-chain treasury.
export function TreasuryPanel({ open, onClose }: TreasuryPanelProps) {
  const {
    canDeposit,
    canWithdraw,
    deposit,
    withdraw,
    status,
    clearStatus,
    withdrawHint,
    depositRateLabel,
    withdrawRateLabel,
    withdrawMinLevel,
    playerLevel,
    withdrawCooldownRemaining,
    isLoading,
  } = useTreasury();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  const handleClose = () => {
    if (isLoading) return;
    clearStatus();
    onClose();
  };

  return createPortal(
    <div className="pointer-events-auto fixed inset-0 z-[210] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]">
      <div
        className="w-full max-w-md rounded-xl border border-white/15 bg-black/95 p-5 text-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="treasury-panel-title"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="treasury-panel-title" className="text-base font-bold text-farm-sun">
              Treasury
            </h2>
            <p className="mt-1 text-xs text-white/65">
              Swap SOL and $CORN through the farm treasury on Solana devnet.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="rounded-lg border border-white/15 px-2 py-1 text-xs text-white/70 transition hover:bg-white/10 disabled:opacity-50"
            aria-label="Close treasury"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <section className="rounded-lg border border-farm-sun/25 bg-farm-sun/10 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-farm-sun">Deposit</h3>
                <p className="mt-1 text-xs text-white/70">{depositRateLabel}</p>
              </div>
              <button
                type="button"
                onClick={() => void deposit()}
                disabled={!canDeposit}
                className="rounded-lg border border-farm-sun/40 bg-farm-sun/20 px-3 py-2 text-xs font-semibold text-farm-sun transition hover:bg-farm-sun/30 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Deposit
              </button>
            </div>
          </section>

          <section className="rounded-lg border border-white/15 bg-white/5 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-white">Withdraw</h3>
                <p className="mt-1 text-xs text-white/70">{withdrawRateLabel}</p>
                <p className="mt-1 text-[11px] text-white/55">{withdrawHint}</p>
                {playerLevel < withdrawMinLevel ? (
                  <p className="mt-1 text-[11px] font-semibold text-amber-200/90">
                    Locked until level {withdrawMinLevel}.
                  </p>
                ) : null}
                {withdrawCooldownRemaining > 0 ? (
                  <p className="mt-1 text-[11px] font-semibold text-amber-200/90">
                    Cooldown: {formatCooldown(withdrawCooldownRemaining)}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => void withdraw()}
                disabled={!canWithdraw}
                className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Withdraw
              </button>
            </div>
          </section>
        </div>

        {status.type !== "idle" ? (
          <p
            className={`mt-4 rounded-lg border px-3 py-2 text-xs ${
              status.type === "success"
                ? "border-lime-400/30 bg-lime-500/10 text-lime-100"
                : status.type === "error"
                  ? "border-red-500/30 bg-red-950/50 text-red-100"
                  : "border-white/15 bg-white/5 text-white/75"
            }`}
          >
            {status.message}
          </p>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
