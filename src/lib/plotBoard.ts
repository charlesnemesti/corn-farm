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
  x: 354,
  y: 191,
  width: 313,
  height: 151,
};

/** Calibrated crop anchor points aligned to the fenced farm rows (5 rows × 6 slots). */
export const PLOT_SLOTS: PlotSlotConfig[] = [
  {
    plotId: 0,
    slots: [
      { x: 357, y: 191 },
      { x: 419, y: 191 },
      { x: 481, y: 191 },
      { x: 543, y: 191 },
      { x: 605, y: 191 },
      { x: 667, y: 191 },
    ],
  },
  {
    plotId: 1,
    slots: [
      { x: 354, y: 227 },
      { x: 416, y: 227 },
      { x: 478, y: 227 },
      { x: 540, y: 227 },
      { x: 602, y: 227 },
      { x: 664, y: 227 },
    ],
  },
  {
    plotId: 2,
    slots: [
      { x: 355, y: 265 },
      { x: 417, y: 265 },
      { x: 479, y: 265 },
      { x: 541, y: 265 },
      { x: 603, y: 265 },
      { x: 665, y: 265 },
    ],
  },
  {
    plotId: 3,
    slots: [
      { x: 355, y: 303 },
      { x: 417, y: 303 },
      { x: 479, y: 303 },
      { x: 541, y: 303 },
      { x: 603, y: 303 },
      { x: 665, y: 303 },
    ],
  },
  {
    plotId: 4,
    slots: [
      { x: 355, y: 342 },
      { x: 417, y: 342 },
      { x: 479, y: 342 },
      { x: 541, y: 342 },
      { x: 603, y: 342 },
      { x: 665, y: 342 },
    ],
  },
];
