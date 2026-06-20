"use client";

import { useGame } from "@/context/GameProvider";
import {
  calculateCornPerHour,
  formatCornPerHour,
} from "@/lib/cropState";
import { formatXpProgress, getXpProgress } from "@/lib/levelConfig";
import { getMenuScale, menuToScreen } from "@/lib/menuCoordinates";
import { STATS_TEXT_ANCHOR, type ScreenPosition } from "@/lib/uiConfig";

type MenuStatsPanelProps = {
  menuPosition: ScreenPosition;
};

// Production, level, and XP lines in the menu Stats section.
export function MenuStatsPanel({ menuPosition }: MenuStatsPanelProps) {
  const { plantedCrops, xp, hydrated } = useGame();
  const scale = getMenuScale();
  const anchor = menuToScreen(
    STATS_TEXT_ANCHOR.x,
    STATS_TEXT_ANCHOR.y,
    menuPosition,
  );
  const fontSize = Math.max(12, 36 * scale);
  const lineGap = STATS_TEXT_ANCHOR.lineGap;
  const cornPerHour = calculateCornPerHour(plantedCrops);
  const xpProgress = getXpProgress(xp);

  const productionLabel = hydrated
    ? `Production: ${formatCornPerHour(cornPerHour)}`
    : "Production: — $CORN/h";
  const levelLabel = hydrated ? `lv : ${xpProgress.level}` : "lv : —";
  const xpLabel = hydrated ? formatXpProgress(xpProgress) : "— / — XP";

  return (
    <div
      className="pointer-events-none absolute z-[46] flex w-[70%] -translate-x-1/2 flex-col items-center text-center font-semibold tracking-wide text-[#4a3428]"
      style={{
        left: anchor.x,
        top: anchor.y + STATS_TEXT_ANCHOR.screenOffsetY,
        fontSize,
        gap: lineGap,
      }}
      aria-label="Farm stats"
    >
      <p>{productionLabel}</p>
      <p>{levelLabel}</p>
      <p>{xpLabel}</p>
    </div>
  );
}
