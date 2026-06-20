// NOTE: All code must stay in English, even when requirements arrive in Spanish.
// Crops keep growing while the tab is closed — rewards are applied from timestamps on load.

import type { GameState } from "./gameState";
import { XP_PER_CYCLE } from "./levelConfig";
import { SEED_STATS } from "./seedConfig";

/** Apply all harvest cycles completed before currentTime (works offline / in background). */
export function applyHarvestProgress(
  state: GameState,
  currentTime = Date.now(),
): GameState {
  let cornGain = 0;
  let xpGain = 0;
  let changed = false;

  const nextCrops = state.plantedCrops.map((crop) => {
    const cycleMs = SEED_STATS[crop.rarity].harvestCycleSeconds * 1000;
    const elapsed = currentTime - crop.cycleStartedAt;
    if (elapsed < cycleMs) return crop;

    const completedCycles = Math.floor(elapsed / cycleMs);
    cornGain += completedCycles * SEED_STATS[crop.rarity].cornPerCycle;
    xpGain += completedCycles * XP_PER_CYCLE[crop.rarity];
    changed = true;
    return {
      ...crop,
      cycleStartedAt: crop.cycleStartedAt + completedCycles * cycleMs,
    };
  });

  if (!changed) return state;

  return {
    ...state,
    corn: state.corn + cornGain,
    xp: state.xp + xpGain,
    plantedCrops: nextCrops,
  };
}
