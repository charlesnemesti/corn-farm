"use client";

import { usePlayMode } from "@/context/PlayModeProvider";
import { useWalletConnectAction } from "@/hooks/useWalletConnectAction";

// Full-screen blur gate — pick Demo or connect wallet for Normal mode.
export function ModeSelectOverlay() {
  const { gateActive, playMode, selectPlayMode } = usePlayMode();
  const { connectWallet, connecting } = useWalletConnectAction();

  if (!gateActive) return null;

  const awaitingWallet = playMode === "wallet";

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/45 p-4 backdrop-blur-md">
      <div
        className="w-full max-w-md rounded-2xl border border-white/15 bg-black/90 p-6 text-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mode-select-title"
      >
        <p className="text-center text-3xl leading-none">🌾</p>
        <h2
          id="mode-select-title"
          className="mt-3 text-center text-xl font-bold text-farm-sun"
        >
          {awaitingWallet ? "Connect your wallet" : "Choose how to play"}
        </h2>
        <p className="mt-2 text-center text-sm leading-relaxed text-white/70">
          {awaitingWallet
            ? "Wallet mode saves your farm server-side and syncs with the on-chain treasury."
            : "Demo is free but limited to row 1 with no withdrawals. Connect a wallet for the full farm."}
        </p>

        {awaitingWallet ? (
          <div className="mt-6 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={connectWallet}
              disabled={connecting}
              className="rounded-lg bg-farm-sun px-4 py-2 text-sm font-semibold text-farm-wood transition hover:bg-farm-sun-dark disabled:opacity-60"
            >
              {connecting ? "Connecting…" : "Connect wallet"}
            </button>
            <button
              type="button"
              onClick={() => selectPlayMode("demo")}
              className="text-xs font-medium text-white/50 underline-offset-2 transition hover:text-white/80 hover:underline"
            >
              Switch to Demo (Free)
            </button>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => selectPlayMode("demo")}
              className="rounded-xl border border-farm-grass/50 bg-farm-grass/15 px-4 py-3 text-left transition hover:bg-farm-grass/25"
            >
              <span className="block text-sm font-bold text-farm-grass">
                Demo (Free)
              </span>
              <span className="mt-1 block text-xs text-white/65">
                One row only, local save, no treasury withdrawals.
              </span>
            </button>

            <button
              type="button"
              onClick={() => selectPlayMode("wallet")}
              className="rounded-xl border border-farm-sun/40 bg-farm-sun/10 px-4 py-3 text-left transition hover:bg-farm-sun/20"
            >
              <span className="block text-sm font-bold text-farm-sun">
                Normal (Wallet)
              </span>
              <span className="mt-1 block text-xs text-white/65">
                Server save, leaderboard, treasury on Solana mainnet.
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
