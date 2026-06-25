"use client";

import { designToScreen, type CoverTransform } from "@/hooks/useCoverTransform";
import { useNpcWalker } from "@/hooks/useNpcWalker";
import { NPC_DISPLAY_SCALE, PIG_NPC, PIG_SPRITE, PIG_WALK_ANIMATION } from "@/lib/npcSprites";
import type { RoutePoint } from "@/lib/routeConfig";
import { NpcSprite } from "./NpcSprite";

type PigNpcProps = {
  route: RoutePoint[];
  transform: CoverTransform;
  paused?: boolean;
};

// Pig NPC that patrols the right-side path from top to bottom.
export function PigNpc({ route, transform, paused = false }: PigNpcProps) {
  const walker = useNpcWalker(route, paused, PIG_WALK_ANIMATION);
  const screen = designToScreen(walker.x, walker.y, transform);
  const spriteScale = transform.scale * NPC_DISPLAY_SCALE;
  const width = PIG_SPRITE.frameWidth * spriteScale;
  const height = PIG_SPRITE.frameHeight * spriteScale;
  const frame = walker.isMoving ? walker.frame : 0;

  return (
    <div
      className="pointer-events-none absolute z-[15]"
      style={{
        left: screen.x - width / 2,
        top: screen.y - height,
        width,
        height,
      }}
      aria-label={`${PIG_NPC.name} walking the farm path`}
    >
      <NpcSprite
        direction={walker.direction}
        frame={frame}
        scale={spriteScale}
        sheet={PIG_SPRITE}
      />
    </div>
  );
}
