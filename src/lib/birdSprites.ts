export type BirdDirection = "up" | "down" | "left" | "right";

export const BIRD_SPRITE = {
  frameWidth: 16,
  frameHeight: 20,
  frameCount: 4,
  frameDurationMs: 90,
} as const;

export const BIRD_SHEETS: Record<BirdDirection, string> = {
  up: "/assets/ambient/bird-fly-up.png",
  down: "/assets/ambient/bird-fly-down.png",
  left: "/assets/ambient/bird-fly-left.png",
  right: "/assets/ambient/bird-fly-right.png",
};
