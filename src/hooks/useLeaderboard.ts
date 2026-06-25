"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useGame } from "@/context/GameProvider";
import { usePlayMode } from "@/context/PlayModeProvider";
import { calculateCornPerHour } from "@/lib/cropState";
import {
  formatWeekCountdown,
  getWeekEndTimestamp,
  shortenWallet,
  WEEKLY_PRIZE_TIERS,
} from "@/lib/leaderboard";

type RankedEntry = {
  rank: number;
  wallet: string;
  displayName: string;
  cornPerHour: number;
  playerLevel: number;
  unlockedRows: number;
  isFounder: boolean;
};

type LeaderboardResponse = {
  weekId: string;
  weekEndsAt: number;
  entries: RankedEntry[];
};

const SUBMIT_DEBOUNCE_MS = 30_000;

export function useLeaderboard() {
  const { publicKey } = useWallet();
  const { playMode } = usePlayMode();
  const { plantedCrops, playerLevel, unlockedPlotIds, hydrated } = useGame();
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const lastSubmitRef = useRef(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/leaderboard", { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as LeaderboardResponse;
      setData(payload);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 60_000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    if (!hydrated || playMode !== "wallet" || !publicKey) return;

    const cornPerHour = calculateCornPerHour(plantedCrops);
    const now = Date.now();
    if (now - lastSubmitRef.current < SUBMIT_DEBOUNCE_MS) return;

    lastSubmitRef.current = now;

    void fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wallet: publicKey.toBase58(),
        cornPerHour,
        playerLevel,
        unlockedRows: unlockedPlotIds.length,
      }),
    }).then(() => refresh());
  }, [
    hydrated,
    playMode,
    plantedCrops,
    playerLevel,
    publicKey,
    refresh,
    unlockedPlotIds.length,
  ]);

  const weekRemainingMs = data ? Math.max(0, data.weekEndsAt - Date.now()) : 0;

  return {
    data,
    loading,
    refresh,
    weekCountdown: formatWeekCountdown(weekRemainingMs),
    weekEndsAt: data?.weekEndsAt ?? getWeekEndTimestamp(),
    prizeTiers: WEEKLY_PRIZE_TIERS,
    playerWallet: publicKey?.toBase58() ?? null,
    shortenWallet,
  };
}
