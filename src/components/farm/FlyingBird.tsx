"use client";

import { useEffect, useRef, useState } from "react";
import { BIRD_SPRITE, type BirdDirection } from "@/lib/birdSprites";
import { BirdSprite } from "./BirdSprite";

type FlyingBirdProps = {
  direction: BirdDirection;
  startX: number;
  startY: number;
  speedPxPerSec: number;
  scale: number;
  viewportWidth: number;
  viewportHeight: number;
  onExit: () => void;
};

// One bird crossing the viewport with wing-flap animation.
export function FlyingBird({
  direction,
  startX,
  startY,
  speedPxPerSec,
  scale,
  viewportWidth,
  viewportHeight,
  onExit,
}: FlyingBirdProps) {
  const [position, setPosition] = useState({ x: startX, y: startY });
  const [frame, setFrame] = useState(0);
  const onExitRef = useRef(onExit);
  onExitRef.current = onExit;

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let animAcc = 0;
    let x = startX;
    let y = startY;
    const margin = Math.max(BIRD_SPRITE.frameWidth, BIRD_SPRITE.frameHeight) * scale * 2;

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;

      animAcc += dt * 1000;
      if (animAcc >= BIRD_SPRITE.frameDurationMs) {
        animAcc %= BIRD_SPRITE.frameDurationMs;
        setFrame((prev) => (prev + 1) % BIRD_SPRITE.frameCount);
      }

      const delta = speedPxPerSec * dt;
      switch (direction) {
        case "left":
          x -= delta;
          break;
        case "right":
          x += delta;
          break;
        case "up":
          y -= delta;
          break;
        case "down":
          y += delta;
          break;
      }

      setPosition({ x, y });

      const offScreen =
        (direction === "left" && x < -margin) ||
        (direction === "right" && x > viewportWidth + margin) ||
        (direction === "up" && y < -margin) ||
        (direction === "down" && y > viewportHeight + margin);

      if (offScreen) {
        onExitRef.current();
        return;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [direction, scale, speedPxPerSec, startX, startY, viewportHeight, viewportWidth]);

  const width = BIRD_SPRITE.frameWidth * scale;
  const height = BIRD_SPRITE.frameHeight * scale;

  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: position.x - width / 2,
        top: position.y - height / 2,
        width,
        height,
      }}
    >
      <BirdSprite direction={direction} frame={frame} scale={scale} />
    </div>
  );
}
