// NOTE: All code must stay in English, even when requirements arrive in Spanish.
// Slot coordinates are in farm-scene.png design space (1024×576) — same on every screen.

export const FARM_BACKGROUND = "/assets/backgrounds/farm-scene.png";

/** Native pixel size of farm-scene.png — coordinates below use this space. */
export const DESIGN_SIZE = {
  width: 1024,
  height: 576,
};

export const PLANT_SPRITE_SIZE = {
  width: 16,
  height: 32,
};

export const PLOT_COUNT = 5;
export const SLOTS_PER_PLOT = 6;

export type SlotPosition = {
  x: number;
  y: number;
};

export type PlotSlotConfig = {
  plotId: number;
  slots: SlotPosition[];
};

/** Bounding box of calibrated furrow slots (for debug overlay reference). */
export const FURROW_BOARD = {
  x: 330,
  y: 190,
  width: 360,
  height: 156,
};

const ROW_Y = [190, 229, 269, 297, 346] as const;
const SLOT_X = [330, 402, 474, 546, 618, 690] as const;

/** Calibrated crop anchor points aligned to the fenced farm rows (5 rows × 6 slots). */
export const PLOT_SLOTS: PlotSlotConfig[] = ROW_Y.map((y, plotId) => ({
  plotId,
  slots: SLOT_X.map((x) => ({ x, y })),
}));
