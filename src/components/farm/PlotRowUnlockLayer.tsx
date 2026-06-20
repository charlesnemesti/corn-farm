"use client";

import { useMemo, useState } from "react";
import { useGame } from "@/context/GameProvider";
import { designToScreen, type CoverTransform } from "@/hooks/useCoverTransform";
import { ConfirmDialog } from "@/components/game/ConfirmDialog";
import { PLOT_SLOTS } from "@/lib/plotBoard";
import {
  canPurchasePlotRow,
  getPlotUnlockConfig,
  getUnlockBlockMessage,
  isPlotRowUnlocked,
} from "@/lib/plotUnlock";

type PlotRowUnlockLayerProps = {
  transform: CoverTransform;
};

// Locked furrow rows — click to purchase with $CORN once level + prior row requirements are met.
export function PlotRowUnlockLayer({ transform }: PlotRowUnlockLayerProps) {
  const { corn, playerLevel, unlockedPlotIds, unlockPlotRow } = useGame();
  const [targetPlotId, setTargetPlotId] = useState<number | null>(null);
  const [unlockMessage, setUnlockMessage] = useState<string | null>(null);

  const targetConfig =
    targetPlotId !== null ? getPlotUnlockConfig(targetPlotId) : undefined;

  const purchaseCheck = useMemo(() => {
    if (targetPlotId === null) return null;
    return canPurchasePlotRow(targetPlotId, unlockedPlotIds, playerLevel, corn);
  }, [corn, playerLevel, targetPlotId, unlockedPlotIds]);

  const dialogMessage = useMemo(() => {
    if (targetPlotId === null || !targetConfig) return "";

    if (purchaseCheck && !purchaseCheck.ok) {
      return getUnlockBlockMessage(purchaseCheck.reason, targetPlotId, targetConfig);
    }

    return `Unlock row ${targetPlotId + 1} for ${targetConfig.cornCost.toLocaleString("en-US")} $CORN? Requires level ${targetConfig.minLevel}. You are level ${playerLevel}.`;
  }, [playerLevel, purchaseCheck, targetConfig, targetPlotId]);

  const canConfirmUnlock = purchaseCheck?.ok === true;

  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-[15]">
        {PLOT_SLOTS.map((plot) => {
          if (isPlotRowUnlocked(plot.plotId, unlockedPlotIds)) return null;

          const config = getPlotUnlockConfig(plot.plotId);
          if (!config) return null;

          const screens = plot.slots.map((slot) =>
            designToScreen(slot.x, slot.y, transform),
          );
          const minX = Math.min(...screens.map((point) => point.x));
          const maxX = Math.max(...screens.map((point) => point.x));
          const centerY =
            screens.reduce((sum, point) => sum + point.y, 0) / screens.length;
          const rowHeight = Math.max(26, 32 * transform.scale);
          const rowWidth = maxX - minX + 48 * transform.scale;
          const check = canPurchasePlotRow(
            plot.plotId,
            unlockedPlotIds,
            playerLevel,
            corn,
          );
          const ready = check.ok;

          return (
            <button
              key={`lock-row-${plot.plotId}`}
              type="button"
              onClick={() => {
                setUnlockMessage(null);
                setTargetPlotId(plot.plotId);
              }}
              className={`pointer-events-auto absolute flex items-center justify-center rounded-md border px-2 text-[10px] font-semibold shadow-lg backdrop-blur-sm transition hover:bg-black/25 sm:text-xs ${
                ready
                  ? "border-farm-sun/40 bg-black/10 text-farm-sun"
                  : "border-white/15 bg-black/10 text-white/75"
              }`}
              style={{
                left: minX - 24 * transform.scale,
                top: centerY - rowHeight / 2,
                width: rowWidth,
                height: rowHeight,
              }}
              aria-label={`Unlock row ${plot.plotId + 1}`}
            >
              <span className="truncate">
                🔒 Row {plot.plotId + 1} · Lv {config.minLevel} ·{" "}
                {config.cornCost.toLocaleString("en-US")} $CORN
              </span>
            </button>
          );
        })}
      </div>

      {unlockMessage ? (
        <div className="pointer-events-none absolute top-28 left-1/2 z-[48] -translate-x-1/2 rounded-lg border border-white/20 bg-black/85 px-3 py-2 text-xs text-white shadow-lg">
          {unlockMessage}
        </div>
      ) : null}

      <ConfirmDialog
        open={targetPlotId !== null}
        title={
          targetPlotId !== null ? `Unlock row ${targetPlotId + 1}?` : "Unlock row?"
        }
        message={dialogMessage}
        confirmLabel={canConfirmUnlock ? "Unlock row" : "Close"}
        cancelLabel={canConfirmUnlock ? "Cancel" : undefined}
        confirmTone={canConfirmUnlock ? "primary" : "primary"}
        onConfirm={() => {
          if (targetPlotId === null) return;

          if (!canConfirmUnlock) {
            setTargetPlotId(null);
            return;
          }

          const result = unlockPlotRow(targetPlotId);
          if (result === "success") {
            setTargetPlotId(null);
            return;
          }

          const config = getPlotUnlockConfig(targetPlotId);
          setUnlockMessage(getUnlockBlockMessage(result, targetPlotId, config));
          setTargetPlotId(null);
          window.setTimeout(() => setUnlockMessage(null), 2500);
        }}
        onCancel={() => setTargetPlotId(null)}
      />
    </>
  );
}
