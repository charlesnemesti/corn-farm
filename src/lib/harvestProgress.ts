// NOTE: All code must stay in English, even when requirements arrive in Spanish.
// Crops keep growing while the tab is closed — rewards are applied from timestamps on load.

import type { GameState } from "./gameState";
import { XP_PER_CYCLE } from "./levelConfig";
import { SEED_STATS } from "./seedConfig";

/** Max offline harvest accrual — "the sun only reaches so far." */
export const OFFLINE_HARVEST_CAP_MS = 10 * 60 * 60 * 1000;

export type HarvestReward = {
  plotId: number;
  slotId: number;
  cornAmount: number;
  /** Timestamp when the last completed cycle finished. */
  completedAt: number;
};

export type HarvestProgressResult = {
  state: GameState;
  rewards: HarvestReward[];
  offlineCapHit: boolean;
};

export type HarvestProgressOptions = {
  growthMultiplier?: number;
  cornMultiplier?: number;
};

/** Apply all harvest cycles completed before currentTime (works offline / in background). */
export function applyHarvestProgress(
  state: GameState,
  currentTime = Date.now(),
  options: HarvestProgressOptions = {},
): HarvestProgressResult {
  const growthMultiplier = options.growthMultiplier ?? 1;
  const cornMultiplier = options.cornMultiplier ?? 1;
  let cornGain = 0;
  let xpGain = 0;
  let changed = false;
  const rewards: HarvestReward[] = [];

  const lastProgressAt = state.lastProgressAt ?? currentTime;
  const awayMs = Math.max(0, currentTime - lastProgressAt);
  const offlineCapHit = awayMs > OFFLINE_HARVEST_CAP_MS;
  const effectiveCurrentTime =
    lastProgressAt + Math.min(awayMs, OFFLINE_HARVEST_CAP_MS);

  const nextCrops = state.plantedCrops.map((crop) => {
    const cycleMs =
      (SEED_STATS[crop.rarity].harvestCycleSeconds * 1000) / growthMultiplier;
    const elapsed = effectiveCurrentTime - crop.cycleStartedAt;
    if (elapsed < cycleMs) return crop;

    const completedCycles = Math.floor(elapsed / cycleMs);
    const cornPerCycle = Math.round(
      SEED_STATS[crop.rarity].cornPerCycle * cornMultiplier,
    );
    cornGain += completedCycles * cornPerCycle;
    xpGain += completedCycles * XP_PER_CYCLE[crop.rarity];
    changed = true;

    for (let cycle = 1; cycle <= completedCycles; cycle++) {
      rewards.push({
        plotId: crop.plotId,
        slotId: crop.slotId,
        cornAmount: cornPerCycle,
        completedAt: crop.cycleStartedAt + cycle * cycleMs,
      });
    }

    return {
      ...crop,
      cycleStartedAt: crop.cycleStartedAt + completedCycles * cycleMs,
    };
  });

  if (!changed) {
    return {
      state: { ...state, lastProgressAt: currentTime },
      rewards: [],
      offlineCapHit,
    };
  }

  return {
    state: {
      ...state,
      corn: state.corn + cornGain,
      xp: state.xp + xpGain,
      plantedCrops: nextCrops,
      lastProgressAt: currentTime,
    },
    rewards,
    offlineCapHit,
  };
}

/** Only show floating harvest popups for cycles that finish while the player is watching. */
export function filterLiveHarvestRewards(
  rewards: HarvestReward[],
  currentTime: number,
  maxAgeMs = 1500,
): HarvestReward[] {
  return rewards.filter(
    (reward) => currentTime - reward.completedAt <= maxAgeMs,
  );
}
