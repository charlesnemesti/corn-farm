"use client";

import { useEffect, useState } from "react";

type TreasuryConfig = {
  depositsEnabled?: boolean;
};

/** Shared treasury launch gate — true until mint + treasury pubkey are configured. */
export function useTreasuryLaunchStatus() {
  const [depositsEnabled, setDepositsEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/treasury/config", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: TreasuryConfig) => {
        if (!cancelled) {
          setDepositsEnabled(payload.depositsEnabled === true);
        }
      })
      .catch(() => {
        if (!cancelled) setDepositsEnabled(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    depositsEnabled,
    launchPending: depositsEnabled !== true,
    onChainTreasuryReady: depositsEnabled === true,
  };
}
