"use client";

import { usePlayMode } from "@/context/PlayModeProvider";
import { useTreasuryLaunchStatus } from "@/hooks/useTreasuryLaunchStatus";
import { LAUNCH_COPY } from "@/lib/launchConfig";

export function WalletLaunchBanner() {
  const { playMode, canPlay } = usePlayMode();
  const { launchPending } = useTreasuryLaunchStatus();

  if (playMode !== "wallet" || !canPlay || !launchPending) return null;

  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 top-14 z-[60] flex justify-center px-4"
    >
      <div className="max-w-2xl rounded-lg border border-sky-400/50 bg-sky-950/90 px-4 py-2.5 text-center text-sm text-sky-50 shadow-lg backdrop-blur">
        <p className="font-semibold text-sky-100">{LAUNCH_COPY.walletBannerTitle}</p>
        <p className="mt-1 text-xs leading-relaxed text-sky-100/90">
          {LAUNCH_COPY.walletBannerBody}
        </p>
      </div>
    </div>
  );
}
