"use client";

import dynamic from "next/dynamic";
import { usePlayMode } from "@/context/PlayModeProvider";

const WalletMultiButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false },
);

// Persistent CTA in demo mode — nudges players toward wallet mode.
export function DemoConnectBanner() {
  const { playMode, selectPlayMode } = usePlayMode();

  if (playMode !== "demo") return null;

  return (
    <div className="pointer-events-auto fixed bottom-4 left-4 z-[120] w-[min(calc(100%-2rem),22rem)] rounded-xl border border-farm-sun/35 bg-black/90 px-4 py-3 text-left shadow-xl">
      <p className="text-xs font-semibold text-farm-sun">Demo mode — row 1 only</p>
      <p className="mt-1 text-[11px] leading-relaxed text-white/70">
        Connect your wallet to unlock more rows, save progress, and compete on the
        leaderboard.
      </p>
      <div className="mt-3 flex flex-col items-start gap-2">
        <WalletMultiButton className="!rounded-lg !bg-farm-sun !px-3 !py-1.5 !text-xs !font-semibold !text-farm-wood hover:!bg-farm-sun-dark" />
        <button
          type="button"
          onClick={() => selectPlayMode("wallet")}
          className="text-[11px] font-medium text-white/55 underline-offset-2 hover:text-white/80 hover:underline"
        >
          Switch to wallet mode
        </button>
      </div>
    </div>
  );
}
