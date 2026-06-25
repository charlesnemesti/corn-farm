// NOTE: All code must stay in English, even when requirements arrive in Spanish.

import type { InventoryEntry } from "./gameState";
import { CORN_SEED_ITEM } from "./itemConfig";

export const DRAG_START_THRESHOLD_PX = 6;

export function isPlantableSeedEntry(entry: InventoryEntry | null): boolean {
  return (
    entry !== null &&
    entry.itemId === CORN_SEED_ITEM.id &&
    entry.rarity !== undefined
  );
}

export type InventoryDragPayload = {
  slotId: number;
  entry: InventoryEntry;
  isPlantableSeed: boolean;
};
