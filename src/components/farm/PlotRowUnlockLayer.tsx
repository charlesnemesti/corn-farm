"use client";

import { useMemo, useState } from "react";
import { usePlayMode } from "@/context/PlayModeProvider";
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

// Locked rows — label only; click anywhere on the row to unlock.
const ROW_UNLOCK_LABEL_OFFSET_Y = -5;
export function PlotRowUnlockLayer({ transform }: PlotRowUnlockLayerProps) {
  const { corn, playerLevel, unlockedPlotIds, unlockPlotRow } = useGame();
  const { playMode } = usePlayMode();
  const demoMode = playMode === "demo";
  const [targetPlotId, setTargetPlotId] = useState<number | null>(null);
  const [unlockMessage, setUnlockMessage] = useState<string | null>(null);

  const targetConfig =
    targetPlotId !== null ? getPlotUnlockConfig(targetPlotId) : undefined;

  const purchaseCheck = useMemo(() => {
    if (targetPlotId === null) return null;
    return canPurchasePlotRow(targetPlotId, unlockedPlotIds, playerLevel, corn, demoMode);
  }, [corn, demoMode, playerLevel, targetPlotId, unlockedPlotIds]);

  const dialogMessage = useMemo(() => {
    if (targetPlotId === null || !targetConfig) return "";

    if (purchaseCheck && !purchaseCheck.ok) {
      return getUnlockBlockMessage(purchaseCheck.reason, targetPlotId, targetConfig);
    }

    return `Unlock row ${targetPlotId + 1} for ${targetConfig.cornCost.toLocaleString("en-US")} $CORN? Requires level ${targetConfig.minLevel}. You are level ${playerLevel}.`;
  }, [playerLevel, purchaseCheck, targetConfig, targetPlotId]);

  const canConfirmUnlock = purchaseCheck?.ok === true;

  const openUnlockDialog = (plotId: number) => {
    setUnlockMessage(null);
    setTargetPlotId(plotId);
  };

  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-[11]">
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
          const check = canPurchasePlotRow(
            plot.plotId,
            unlockedPlotIds,
            playerLevel,
            corn,
            demoMode,
          );
          const ready = check.ok;
          const rowHeight = Math.max(26, 32 * transform.scale);
          const rowWidth = maxX - minX + 48 * transform.scale;

          return (
            <div key={`lock-row-${plot.plotId}`}>
              <button
                type="button"
                onClick={() => openUnlockDialog(plot.plotId)}
                className="pointer-events-auto absolute cursor-pointer"
                style={{
                  left: minX - 24 * transform.scale,
                  top: centerY - rowHeight / 2 + ROW_UNLOCK_LABEL_OFFSET_Y,
                  width: rowWidth,
                  height: rowHeight,
                }}
                aria-label={`Unlock row ${plot.plotId + 1}`}
              />

              <p
                className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-center text-[10px] font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] sm:text-xs ${
                  ready ? "text-farm-sun" : "text-white/80"
                }`}
                style={{
                  left: (minX + maxX) / 2,
                  top: centerY + ROW_UNLOCK_LABEL_OFFSET_Y,
                }}
              >
                {demoMode ? "Connect wallet · " : ""}
                🔒 Row {plot.plotId + 1} · Lv {config.minLevel} ·{" "}
                {config.cornCost.toLocaleString("en-US")} $CORN
              </p>
            </div>
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
        confirmTone="primary"
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
