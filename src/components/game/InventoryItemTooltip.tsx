"use client";

import type { ReactNode } from "react";
import { useDrag } from "@/context/DragProvider";
import type { InventoryEntry } from "@/lib/gameState";
import {
  SEED_PACK_TOOLTIP,
  getInventoryItemImage,
  isSeedPack,
} from "@/lib/itemConfig";
import {
  RARITY_LABELS,
  RARITY_TEXT_CLASS,
  SEED_STATS,
  formatHarvestCycle,
  type SeedRarity,
} from "@/lib/seedConfig";

type InventoryItemTooltipProps = {
  entry: InventoryEntry;
  onDiscard?: () => void;
};

function DiscardButton({ onDiscard }: { onDiscard: () => void }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onDiscard();
      }}
      onMouseDown={(event) => event.stopPropagation()}
      className="mt-2 w-full rounded-md border border-red-500/35 bg-red-950/70 px-2 py-1 text-[10px] font-semibold text-red-200 transition hover:bg-red-900/80"
    >
      Discard
    </button>
  );
}

type TooltipAnchorProps = {
  widthClass: string;
  children: ReactNode;
};

// Padding below the panel bridges the gap so hover stays active while moving to Discard.
function TooltipAnchor({ widthClass, children }: TooltipAnchorProps) {
  return (
    <div
      className={`pointer-events-none absolute bottom-full left-1/2 z-[60] ${widthClass} -translate-x-1/2 pb-3 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100`}
    >
      <div className="rounded-lg border border-white/15 bg-black/95 p-2.5 text-left text-white shadow-xl">
        {children}
      </div>
    </div>
  );
}

export function InventoryItemTooltip({ entry, onDiscard }: InventoryItemTooltipProps) {
  if (isSeedPack(entry.itemId)) {
    return (
      <TooltipAnchor widthClass="w-44">
        <p className="text-xs font-bold text-farm-sun">{SEED_PACK_TOOLTIP.title}</p>
        <p className="mt-1 text-[11px] leading-snug text-white/70">
          {SEED_PACK_TOOLTIP.description}
        </p>
        {onDiscard ? <DiscardButton onDiscard={onDiscard} /> : null}
      </TooltipAnchor>
    );
  }

  if (entry.rarity === undefined) return null;

  const rarity = entry.rarity as SeedRarity;
  const stats = SEED_STATS[rarity];

  return (
    <TooltipAnchor widthClass="w-48">
      <p className={`text-xs font-bold ${RARITY_TEXT_CLASS[rarity]}`}>
        {RARITY_LABELS[rarity]}
      </p>
      <p className="mt-1 text-[11px] leading-snug text-white/65">
        {stats.description}
      </p>
      <dl className="mt-2 space-y-1 text-[11px]">
        <div className="flex justify-between gap-2">
          <dt className="text-white/50">Harvest cycle</dt>
          <dd className="font-semibold text-white/90">
            {formatHarvestCycle(stats.harvestCycleSeconds)}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-white/50">$CORN / cycle</dt>
          <dd className="font-semibold text-farm-sun">
            {stats.cornPerCycle.toLocaleString("en-US")}
          </dd>
        </div>
      </dl>
      {onDiscard ? <DiscardButton onDiscard={onDiscard} /> : null}
    </TooltipAnchor>
  );
}

type InventoryItemVisualProps = {
  slotId: number;
  entry: InventoryEntry;
  itemSize: number;
  selected?: boolean;
  isDragSource?: boolean;
  onOpenPack?: () => void;
  onSelectSeed?: () => void;
  onDiscard?: () => void;
};

export function InventoryItemVisual({
  slotId,
  entry,
  itemSize,
  selected = false,
  isDragSource = false,
  onOpenPack,
  onSelectSeed,
  onDiscard,
}: InventoryItemVisualProps) {
  const { startPointerDrag, shouldBlockClick } = useDrag();
  const imageSrc = getInventoryItemImage(entry);
  if (!imageSrc) return null;

  const iconSize = itemSize * 0.85;
  const isSeed = !isSeedPack(entry.itemId) && entry.rarity !== undefined;

  return (
    <div
      className={`group absolute flex touch-none items-center justify-center rounded-lg ${
        selected ? "ring-2 ring-farm-sun ring-offset-1 ring-offset-transparent" : ""
      } ${isDragSource ? "pointer-events-none opacity-35" : "cursor-grab active:cursor-grabbing"}`}
      style={{
        width: itemSize,
        height: itemSize,
      }}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        startPointerDrag(slotId, entry, event.clientX, event.clientY);
      }}
      onClick={() => {
        if (shouldBlockClick()) return;

        if (isSeedPack(entry.itemId)) {
          onOpenPack?.();
          return;
        }
        if (isSeed) {
          onSelectSeed?.();
        }
      }}
    >
      <InventoryItemTooltip entry={entry} onDiscard={onDiscard} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc}
        alt={entry.rarity ? RARITY_LABELS[entry.rarity] : entry.itemId}
        draggable={false}
        className="object-contain drop-shadow pixel-art transition-transform duration-150 group-hover:scale-105"
        style={{ width: iconSize, height: iconSize }}
      />
      {entry.quantity > 1 ? (
        <span className="absolute right-0 bottom-0 rounded bg-black/75 px-1 text-[10px] font-bold text-white">
          {entry.quantity}
        </span>
      ) : null}
    </div>
  );
}
