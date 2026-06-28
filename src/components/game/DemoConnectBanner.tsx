"use client";

import { usePlayMode } from "@/context/PlayModeProvider";
import { useWalletConnectAction } from "@/hooks/useWalletConnectAction";
import { LAUNCH_COPY } from "@/lib/launchConfig";

// Persistent CTA in demo mode — nudges players toward wallet mode when live.
export function DemoConnectBanner() {
  const { playMode } = usePlayMode();
  const { connectWallet, connecting, walletModeEnabled } = useWalletConnectAction();

  if (playMode !== "demo") return null;

  if (!walletModeEnabled) {
    return (
      <div
        role="status"
        className="pointer-events-none fixed bottom-4 left-4 z-[120] w-[min(calc(100%-2rem),22rem)] rounded-xl border border-sky-400/40 bg-sky-950/90 px-4 py-3 text-left shadow-xl"
      >
        <p className="text-xs font-semibold text-sky-100">
          {LAUNCH_COPY.walletModeBlockedTitle}
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-sky-100/85">
          {LAUNCH_COPY.walletModeBlockedBody}
        </p>
      </div>
    );
  }

  return (
    <div className="pointer-events-auto fixed bottom-4 left-4 z-[120] w-[min(calc(100%-2rem),22rem)] rounded-xl border border-farm-sun/35 bg-black/90 px-4 py-3 text-left shadow-xl">
      <p className="text-xs font-semibold text-farm-sun">Demo mode — row 1 only</p>
      <p className="mt-1 text-[11px] leading-relaxed text-white/70">
        Connect your wallet to unlock more rows, save progress, and compete on the
        leaderboard.
      </p>
      <div className="mt-3 flex flex-col items-start gap-2">
        <button
          type="button"
          onClick={connectWallet}
          disabled={connecting}
          className="rounded-lg bg-farm-sun px-3 py-1.5 text-xs font-semibold text-farm-wood transition hover:bg-farm-sun-dark disabled:opacity-60"
        >
          {connecting ? "Connecting…" : "Connect wallet"}
        </button>
      </div>
    </div>
  );
}
