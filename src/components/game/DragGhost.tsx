"use client";

import type { InventoryEntry } from "@/lib/gameState";
import { getInventoryItemImage } from "@/lib/itemConfig";
import { RARITY_LABELS } from "@/lib/seedConfig";

type DragGhostProps = {
  entry: InventoryEntry;
  x: number;
  y: number;
};

// Floating item preview while dragging.
export function DragGhost({ entry, x, y }: DragGhostProps) {
  const imageSrc = getInventoryItemImage(entry);
  if (!imageSrc) return null;

  return (
    <div
      className="pointer-events-none fixed z-[220] -translate-x-1/2 -translate-y-1/2"
      style={{ left: x, top: y }}
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc}
        alt={entry.rarity ? RARITY_LABELS[entry.rarity] : entry.itemId}
        draggable={false}
        className="drag-ghost pixel-art h-14 w-14 object-contain drop-shadow-lg"
      />
    </div>
  );
}
