// NOTE: All code must stay in English, even when requirements arrive in Spanish.

export const FARM_MENU = {
  src: "/assets/ui/MENU.png",
  width: 1133,
  height: 1600,
  /** On-screen width — height follows aspect ratio (base 290px + 60%). */
  displayWidth: 464,
} as const;

/** Corn Farm title logo centered on the menu's top wooden plaque. */
export const MENU_TITLE = {
  src: "/assets/ui/corn-farm-title.png",
  width: 1000,
  height: 529,
  anchorX: 566,
  anchorY: 100,
  displayWidth: 450,
  /** Fine-tune position in rendered menu pixels. */
  screenOffsetX: -15,
  screenOffsetY: 25,
} as const;

export type ScreenPosition = {
  x: number;
  y: number;
};

/** Top-left anchor in farm-scene.png design space (1024×571). */
export const GAME_MENU_DESIGN_ANCHOR: ScreenPosition = {
  x: 838,
  y: 284,
};

/** @deprecated Alias for GAME_MENU_DESIGN_ANCHOR (design space, not screen pixels). */
export const GAME_MENU_POSITION = GAME_MENU_DESIGN_ANCHOR;

/** First stats line anchor in MENU.png space (centered under the Stats divider). */
export const STATS_TEXT_ANCHOR = {
  x: 566,
  y: 980,
  /** Extra downward offset applied in screen pixels after menu scaling. */
  screenOffsetY: 10,
  /** Vertical gap between stats lines in screen pixels. */
  lineGap: 6,
} as const;

export function getGameMenuDisplaySize() {
  const scale = FARM_MENU.displayWidth / FARM_MENU.width;
  return {
    width: FARM_MENU.displayWidth,
    height: FARM_MENU.height * scale,
  };
}
