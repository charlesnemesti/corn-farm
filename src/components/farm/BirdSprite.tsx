import type { CSSProperties } from "react";
import {
  BIRD_SHEETS,
  BIRD_SPRITE,
  type BirdDirection,
} from "@/lib/birdSprites";

type BirdSpriteProps = {
  direction: BirdDirection;
  frame: number;
  scale: number;
};

// Single frame from a horizontal bird fly spritesheet.
export function BirdSprite({ direction, frame, scale }: BirdSpriteProps) {
  const width = BIRD_SPRITE.frameWidth * scale;
  const height = BIRD_SPRITE.frameHeight * scale;
  const sheetWidth = width * BIRD_SPRITE.frameCount;
  const clampedFrame = frame % BIRD_SPRITE.frameCount;

  const style: CSSProperties = {
    width,
    height,
    backgroundImage: `url(${BIRD_SHEETS[direction]})`,
    backgroundSize: `${sheetWidth}px ${height}px`,
    backgroundPosition: `-${clampedFrame * width}px 0`,
  };

  return (
    <span className="pixel-art block bg-no-repeat" style={style} aria-hidden />
  );
}
