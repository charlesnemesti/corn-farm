// NOTE: All code must stay in English, even when requirements arrive in Spanish.

import type { SeedRarity } from "./seedConfig";
import { SEED_STATS } from "./seedConfig";
import type { WeatherType } from "./weatherConfig";
import type { GameState, InventoryEntry } from "./gameState";
import { CORN_SEED_ITEM } from "./itemConfig";

export type WeatherEffectConfig = {
  growthMultiplier: number;
  cornMultiplier: number;
  uprootCheckIntervalMs?: number;
  uprootChance?: number;
  maxUprootsPerWindow?: number;
};

export const WEATHER_EFFECTS: Record<WeatherType, WeatherEffectConfig> = {
  sunny: { growthMultiplier: 1, cornMultiplier: 1 },
  rain: { growthMultiplier: 1.25, cornMultiplier: 1.25 },
  snow: { growthMultiplier: 0.75, cornMultiplier: 1 },
  wind: {
    growthMultiplier: 1,
    cornMultiplier: 1,
    uprootCheckIntervalMs: 45_000,
    uprootChance: 0.015,
    maxUprootsPerWindow: 1,
  },
};

export function getWeatherGrowthMultiplier(weather: WeatherType): number {
  return WEATHER_EFFECTS[weather].growthMultiplier;
}

export function getWeatherCornMultiplier(weather: WeatherType): number {
  return WEATHER_EFFECTS[weather].cornMultiplier;
}

export function getEffectiveCycleMs(
  rarity: SeedRarity,
  weather: WeatherType,
): number {
  const baseMs = SEED_STATS[rarity].harvestCycleSeconds * 1000;
  const growth = getWeatherGrowthMultiplier(weather);
  return baseMs / growth;
}

export function getWeatherProductionLabel(weather: WeatherType): string | null {
  switch (weather) {
    case "rain":
      return "Rain +25%";
    case "snow":
      return "Snow −25% growth";
    case "wind":
      return "Wind risk";
    default:
      return null;
  }
}

export function returnSeedToInventory(
  state: GameState,
  rarity: SeedRarity,
): { ok: true; state: GameState } | { ok: false } {
  const stackIndex = state.inventory.findIndex(
    (entry) =>
      entry !== null &&
      entry.itemId === CORN_SEED_ITEM.id &&
      entry.rarity === rarity,
  );

  if (stackIndex >= 0) {
    const entry = state.inventory[stackIndex] as InventoryEntry;
    const nextInventory = [...state.inventory];
    nextInventory[stackIndex] = {
      ...entry,
      quantity: entry.quantity + 1,
    };
    return {
      ok: true,
      state: { ...state, inventory: nextInventory },
    };
  }

  const emptyIndex = state.inventory.findIndex((entry) => entry === null);
  if (emptyIndex === -1) {
    return { ok: false };
  }

  const nextInventory = [...state.inventory];
  nextInventory[emptyIndex] = {
    itemId: CORN_SEED_ITEM.id,
    quantity: 1,
    rarity,
  };

  return {
    ok: true,
    state: { ...state, inventory: nextInventory },
  };
}

export function tryWindUproot(
  state: GameState,
  chance: number,
): {
  state: GameState;
  uprooted: boolean;
  plotId?: number;
  slotId?: number;
} {
  if (state.plantedCrops.length === 0) {
    return { state, uprooted: false };
  }

  const shuffled = [...state.plantedCrops].sort(() => Math.random() - 0.5);

  for (const crop of shuffled) {
    if (Math.random() >= chance) continue;

    const withSeed = returnSeedToInventory(state, crop.rarity);
    if (!withSeed.ok) continue;

    const nextCrops = withSeed.state.plantedCrops.filter(
      (planted) =>
        planted.plotId !== crop.plotId || planted.slotId !== crop.slotId,
    );

    return {
      state: { ...withSeed.state, plantedCrops: nextCrops },
      uprooted: true,
      plotId: crop.plotId,
      slotId: crop.slotId,
    };
  }

  return { state, uprooted: false };
}
