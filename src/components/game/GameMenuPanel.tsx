"use client";

import {
  FARM_MENU,
  getGameMenuDisplaySize,
  MENU_TITLE,
  type ScreenPosition,
} from "@/lib/uiConfig";

type GameMenuPanelProps = {
  position: ScreenPosition;
  calibratorActive?: boolean;
};

// Pixel-art game menu shell — transparent PNG, ready for future UI content.
export function GameMenuPanel({
  position,
  calibratorActive = false,
}: GameMenuPanelProps) {
  const { width, height } = getGameMenuDisplaySize();
  const titleLeft = (MENU_TITLE.anchorX / FARM_MENU.width) * 100;
  const titleTop = (MENU_TITLE.anchorY / FARM_MENU.height) * 100;
  const titleWidth = (MENU_TITLE.displayWidth / FARM_MENU.width) * 100;

  return (
    <div
      className="pointer-events-none absolute z-[45]"
      style={{ left: position.x, top: position.y, width, height }}
    >
      <div
        className={`relative h-full w-full ${calibratorActive ? "ring-2 ring-yellow-400 ring-offset-2 ring-offset-transparent" : ""}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={FARM_MENU.src}
          alt="Game menu"
          draggable={false}
          className="pointer-events-none h-full w-full object-contain pixel-art"
        />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={MENU_TITLE.src}
          alt="Corn Farm"
          draggable={false}
          className="pointer-events-none absolute z-10 h-auto -translate-x-1/2 -translate-y-1/2 object-contain pixel-art mix-blend-screen"
          style={{
            left: `calc(${titleLeft}% + ${MENU_TITLE.screenOffsetX}px)`,
            top: `calc(${titleTop}% + ${MENU_TITLE.screenOffsetY}px)`,
            width: `${titleWidth}%`,
          }}
        />
      </div>
    </div>
  );
}
