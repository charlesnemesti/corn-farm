// NOTE: All code must stay in English, even when requirements arrive in Spanish.

import type { SeedRarity } from "./seedConfig";
import { SEED_STATS } from "./seedConfig";
import type { WeatherType } from "./weatherConfig";
import { getEffectiveCycleMs, getWeatherCornMultiplier, getWeatherGrowthMultiplier } from "./weatherEffects";

export type PlantedCrop = {
  plotId: number;
  slotId: number;
  rarity: SeedRarity;
  cycleStartedAt: number;
};

export function cropKey(plotId: number, slotId: number): string {
  return `${plotId}-${slotId}`;
}

export function findPlantedCrop(
  plantedCrops: PlantedCrop[],
  plotId: number,
  slotId: number,
): PlantedCrop | undefined {
  return plantedCrops.find(
    (crop) => crop.plotId === plotId && crop.slotId === slotId,
  );
}

export function getCycleProgress(
  crop: PlantedCrop,
  now = Date.now(),
  weather: WeatherType = "sunny",
): { remainingMs: number; progress: number } {
  const cycleMs = getEffectiveCycleMs(crop.rarity, weather);
  const elapsed = now - crop.cycleStartedAt;
  const remainder = ((elapsed % cycleMs) + cycleMs) % cycleMs;
  const remainingMs = cycleMs - remainder;
  const progress = remainder / cycleMs;
  return { remainingMs, progress };
}

export function formatRemainingTime(remainingMs: number): string {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${seconds}s`;
}

/** Sum hourly $CORN output from all currently planted crops. */
export function calculateCornPerHour(
  plantedCrops: PlantedCrop[],
  weather: WeatherType = "sunny",
): number {
  const growth = getWeatherGrowthMultiplier(weather);
  const cornMult = getWeatherCornMultiplier(weather);

  return plantedCrops.reduce((total, crop) => {
    const stats = SEED_STATS[crop.rarity];
    const effectiveCycleSeconds = stats.harvestCycleSeconds / growth;
    const effectiveCornPerCycle = stats.cornPerCycle * cornMult;
    const cornPerSecond = effectiveCornPerCycle / effectiveCycleSeconds;
    return total + cornPerSecond * 3600;
  }, 0);
}

export function formatCornPerHour(rate: number): string {
  const rounded = Math.round(rate * 10) / 10;
  const formatted = Number.isInteger(rounded)
    ? rounded.toLocaleString("en-US")
    : rounded.toLocaleString("en-US", { maximumFractionDigits: 1 });
  return `${formatted} $CORN/h`;
}
