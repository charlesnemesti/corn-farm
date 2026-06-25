"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BirdDirection } from "@/lib/birdSprites";
import { FlyingBird } from "./FlyingBird";

type SkyBirdsLayerProps = {
  viewportWidth: number;
  viewportHeight: number;
};

type ActiveBird = {
  id: number;
  direction: BirdDirection;
  startX: number;
  startY: number;
  speedPxPerSec: number;
  scale: number;
};

type ScreenEdge = "top" | "right" | "bottom" | "left";

const SPAWN_MIN_MS = 5000;
const SPAWN_MAX_MS = 10000;
const SPAWN_MARGIN = 48;

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randomSpawnDelayMs(): number {
  return randomBetween(SPAWN_MIN_MS, SPAWN_MAX_MS);
}

function pickRandomEdge(): ScreenEdge {
  const edges: ScreenEdge[] = ["top", "right", "bottom", "left"];
  return edges[Math.floor(Math.random() * edges.length)] ?? "left";
}

function createBird(
  id: number,
  viewportWidth: number,
  viewportHeight: number,
): ActiveBird {
  const edge = pickRandomEdge();
  const scale = randomBetween(2.2, 3.4);
  const speedPxPerSec = randomBetween(55, 115);

  switch (edge) {
    case "top":
      return {
        id,
        direction: "down",
        startX: randomBetween(0, viewportWidth),
        startY: -SPAWN_MARGIN,
        speedPxPerSec,
        scale,
      };
    case "bottom":
      return {
        id,
        direction: "up",
        startX: randomBetween(0, viewportWidth),
        startY: viewportHeight + SPAWN_MARGIN,
        speedPxPerSec,
        scale,
      };
    case "left":
      return {
        id,
        direction: "right",
        startX: -SPAWN_MARGIN,
        startY: randomBetween(0, viewportHeight),
        speedPxPerSec,
        scale,
      };
    case "right":
      return {
        id,
        direction: "left",
        startX: viewportWidth + SPAWN_MARGIN,
        startY: randomBetween(0, viewportHeight),
        speedPxPerSec,
        scale,
      };
    default:
      return {
        id,
        direction: "right",
        startX: -SPAWN_MARGIN,
        startY: randomBetween(0, viewportHeight),
        speedPxPerSec,
        scale,
      };
  }
}

// Ambient birds that cross the farm one at a time from a random screen edge.
export function SkyBirdsLayer({
  viewportWidth,
  viewportHeight,
}: SkyBirdsLayerProps) {
  const [birds, setBirds] = useState<ActiveBird[]>([]);
  const nextId = useRef(0);
  const spawnTimeout = useRef(0);

  const removeBird = useCallback((id: number) => {
    setBirds((prev) => prev.filter((bird) => bird.id !== id));
  }, []);

  const spawnBird = useCallback(() => {
    const bird = createBird(nextId.current, viewportWidth, viewportHeight);
    nextId.current += 1;
    setBirds((prev) => [...prev, bird]);
  }, [viewportHeight, viewportWidth]);

  useEffect(() => {
    if (viewportWidth < 1 || viewportHeight < 1) return;

    const scheduleNext = () => {
      spawnTimeout.current = window.setTimeout(() => {
        spawnBird();
        scheduleNext();
      }, randomSpawnDelayMs());
    };

    scheduleNext();

    return () => {
      window.clearTimeout(spawnTimeout.current);
    };
  }, [spawnBird, viewportHeight, viewportWidth]);

  if (viewportWidth < 1 || viewportHeight < 1) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[13] overflow-hidden">
      {birds.map((bird) => (
        <FlyingBird
          key={bird.id}
          direction={bird.direction}
          startX={bird.startX}
          startY={bird.startY}
          speedPxPerSec={bird.speedPxPerSec}
          scale={bird.scale}
          viewportWidth={viewportWidth}
          viewportHeight={viewportHeight}
          onExit={() => removeBird(bird.id)}
        />
      ))}
    </div>
  );
}
