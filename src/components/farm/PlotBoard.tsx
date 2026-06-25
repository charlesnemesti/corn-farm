"use client";

import { useState } from "react";
import { useDrag } from "@/context/DragProvider";
import { useGame } from "@/context/GameProvider";
import { useTutorial } from "@/context/TutorialProvider";
import { designToScreen, type CoverTransform } from "@/hooks/useCoverTransform";
import type { PlotSlotConfig } from "@/lib/plotBoard";
import { PLOT_SLOTS } from "@/lib/plotBoard";
import { CropSlot } from "./CropSlot";
import { CropUprootDialog } from "./CropUprootDialog";

type PlotBoardProps = {
  transform: CoverTransform;
  slots?: PlotSlotConfig[];
};

type UprootTarget = {
  plotId: number;
  slotId: number;
  rarity: "common" | "rare" | "epic";
};

// Interactive crop layer over the furrows.
export function PlotBoard({
  transform,
  slots = PLOT_SLOTS,
}: PlotBoardProps) {
  const {
    now,
    plantingSeedSlot,
    plantSelectedSeed,
    isSlotPlantable,
    isPlotRowUnlocked,
    getCropAt,
    uprootCrop,
  } = useGame();
  const { notifyEvent, isStep, tutorialCrop } = useTutorial();
  const { isDraggingSeed } = useDrag();
  const [uprootTarget, setUprootTarget] = useState<UprootTarget | null>(null);

  const plantingMode = plantingSeedSlot !== null;

  let tutorialPlantSlot: { plotId: number; slotId: number } | null = null;
  if (isStep("plant-seed") && plantingMode) {
    for (const plot of slots) {
      if (!isPlotRowUnlocked(plot.plotId)) continue;
      for (let slotIndex = 0; slotIndex < plot.slots.length; slotIndex++) {
        if (
          !getCropAt(plot.plotId, slotIndex) &&
          isSlotPlantable(plot.plotId, slotIndex)
        ) {
          tutorialPlantSlot = { plotId: plot.plotId, slotId: slotIndex };
          break;
        }
      }
      if (tutorialPlantSlot) break;
    }
  }

  const tutorialHarvestSlot = isStep("wait-harvest") ? tutorialCrop : null;

  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="pointer-events-auto absolute inset-0">
          {slots.flatMap((plot) => {
            if (!isPlotRowUnlocked(plot.plotId)) return [];

            return plot.slots.map((slot, slotIndex) => {
              const screen = designToScreen(slot.x, slot.y, transform);
              const planted = getCropAt(plot.plotId, slotIndex);
              const plantable =
                plantingMode && !planted && isSlotPlantable(plot.plotId, slotIndex);
              const acceptsSeedDrop =
                isDraggingSeed &&
                !planted &&
                isSlotPlantable(plot.plotId, slotIndex);
              const isTutorialFurrow =
                (tutorialPlantSlot?.plotId === plot.plotId &&
                  tutorialPlantSlot?.slotId === slotIndex) ||
                (tutorialHarvestSlot?.plotId === plot.plotId &&
                  tutorialHarvestSlot?.slotId === slotIndex);

              return (
                <CropSlot
                  key={`${plot.plotId}-${slotIndex}`}
                  plotIndex={plot.plotId}
                  slotIndex={slotIndex}
                  x={screen.x}
                  y={screen.y}
                  scale={transform.scale}
                  now={now}
                  planted={planted}
                  plantable={plantable}
                  acceptsSeedDrop={acceptsSeedDrop}
                  tutorialHighlight={isTutorialFurrow}
                  onPlant={() => {
                    const result = plantSelectedSeed(plot.plotId, slotIndex);
                    if (result === "success") {
                      notifyEvent("seed-planted", {
                        plotId: plot.plotId,
                        slotId: slotIndex,
                      });
                    }
                  }}
                  onUproot={
                    !plantingMode && planted
                      ? () =>
                          setUprootTarget({
                            plotId: plot.plotId,
                            slotId: slotIndex,
                            rarity: planted.rarity,
                          })
                      : undefined
                  }
                />
              );
            });
          })}
        </div>
      </div>

      <CropUprootDialog
        open={uprootTarget !== null}
        rarity={uprootTarget?.rarity ?? "common"}
        onConfirm={() => {
          if (!uprootTarget) return;
          uprootCrop(uprootTarget.plotId, uprootTarget.slotId);
          setUprootTarget(null);
        }}
        onCancel={() => setUprootTarget(null)}
      />
    </>
  );
}
