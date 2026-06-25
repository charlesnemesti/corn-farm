import type { CSSProperties } from "react";
import {
  FARMER_SPRITE,
  type NpcDirection,
  type NpcSpriteSheet,
} from "@/lib/npcSprites";

type NpcSpriteProps = {
  direction: NpcDirection;
  frame: number;
  scale: number;
  sheet?: NpcSpriteSheet;
};

const DIRECTION_ROW: Record<NpcDirection, number> = {
  down: 0,
  left: 1,
  right: 2,
  up: 3,
};

function resolveStripSrc(sheet: NpcSpriteSheet, direction: NpcDirection): string {
  if (sheet.directionSrc?.[direction]) {
    return sheet.directionSrc[direction];
  }
  if (!sheet.src) {
    throw new Error(`NpcSprite missing src for direction "${direction}"`);
  }
  return sheet.src;
}

// Renders one NPC frame from a directional spritesheet or per-direction strip.
export function NpcSprite({
  direction,
  frame,
  scale,
  sheet = FARMER_SPRITE,
}: NpcSpriteProps) {
  const width = sheet.frameWidth * scale;
  const height = sheet.frameHeight * scale;
  const clampedFrame = Math.max(
    0,
    Math.min(frame, sheet.framesPerDirection - 1),
  );
  const usesDirectionStrip = Boolean(sheet.directionSrc?.[direction]);
  const imageSrc = resolveStripSrc(sheet, direction);

  let backgroundSize: string;
  let backgroundPosition: string;

  if (usesDirectionStrip) {
    backgroundSize = `${sheet.frameWidth * sheet.framesPerDirection * scale}px ${height}px`;
    backgroundPosition = `-${clampedFrame * sheet.frameWidth * scale}px 0px`;
  } else {
    const sheetWidth = sheet.frameWidth * sheet.framesPerDirection * scale;
    const rowCount = sheet.directions?.length ?? 4;
    const sheetHeight = sheet.frameHeight * rowCount * scale;
    const row = DIRECTION_ROW[direction];
    backgroundSize = `${sheetWidth}px ${sheetHeight}px`;
    backgroundPosition = `-${clampedFrame * sheet.frameWidth * scale}px -${row * sheet.frameHeight * scale}px`;
  }

  const style: CSSProperties = {
    width,
    height,
    backgroundImage: `url(${imageSrc})`,
    backgroundSize,
    backgroundPosition,
  };

  return (
    <span
      className="pixel-art pointer-events-none absolute bottom-0 left-1/2 block -translate-x-1/2 bg-no-repeat"
      style={style}
      aria-hidden
    />
  );
}
