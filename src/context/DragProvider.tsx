"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useGame } from "@/context/GameProvider";
import { useTutorial } from "@/context/TutorialProvider";
import { DragGhost } from "@/components/game/DragGhost";
import {
  DRAG_START_THRESHOLD_PX,
  type InventoryDragPayload,
  isPlantableSeedEntry,
} from "@/lib/inventoryDrag";
import type { InventoryEntry } from "@/lib/gameState";

type DragContextValue = {
  isDragging: boolean;
  isDraggingSeed: boolean;
  dragSourceSlotId: number | null;
  shouldBlockClick: () => boolean;
  startPointerDrag: (
    slotId: number,
    entry: InventoryEntry,
    clientX: number,
    clientY: number,
  ) => void;
};

const DragContext = createContext<DragContextValue | null>(null);

type PendingDrag = {
  slotId: number;
  entry: InventoryEntry;
  startX: number;
  startY: number;
};

export function DragProvider({ children }: { children: ReactNode }) {
  const { moveInventoryItem, plantSeedFromSlot } = useGame();
  const { notifyEvent } = useTutorial();
  const [mounted, setMounted] = useState(false);
  const [payload, setPayload] = useState<InventoryDragPayload | null>(null);
  const payloadRef = useRef<InventoryDragPayload | null>(null);
  const [ghostPosition, setGhostPosition] = useState<{ x: number; y: number } | null>(
    null,
  );
  const pendingRef = useRef<PendingDrag | null>(null);
  const activeRef = useRef(false);
  const blockClickRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const finishPointerListeners = useRef<(() => void) | null>(null);

  const clearPointerListeners = useCallback(() => {
    finishPointerListeners.current?.();
    finishPointerListeners.current = null;
  }, []);

  const resolveDrop = useCallback(
    (clientX: number, clientY: number, dragPayload: InventoryDragPayload) => {
      const target = document
        .elementFromPoint(clientX, clientY)
        ?.closest<HTMLElement>("[data-drop-target]");

      if (!target) return;

      const dropType = target.dataset.dropTarget;

      if (dropType === "inventory") {
        const slotId = Number(target.dataset.inventorySlot);
        if (!Number.isNaN(slotId)) {
          moveInventoryItem(dragPayload.slotId, slotId);
        }
        return;
      }

      if (dropType === "crop" && dragPayload.isPlantableSeed) {
        const plotId = Number(target.dataset.plot);
        const slotId = Number(target.dataset.slot);
        if (Number.isNaN(plotId) || Number.isNaN(slotId)) return;

        const result = plantSeedFromSlot(dragPayload.slotId, plotId, slotId);
        if (result === "success") {
          notifyEvent("seed-planted", { plotId, slotId });
        }
      }
    },
    [moveInventoryItem, notifyEvent, plantSeedFromSlot],
  );

  const endDrag = useCallback(
    (clientX: number, clientY: number) => {
      const dragPayload = payloadRef.current;
      clearPointerListeners();
      pendingRef.current = null;
      activeRef.current = false;
      payloadRef.current = null;
      setPayload(null);
      setGhostPosition(null);

      if (dragPayload) {
        blockClickRef.current = true;
        window.setTimeout(() => {
          blockClickRef.current = false;
        }, 0);
        resolveDrop(clientX, clientY, dragPayload);
      }
    },
    [clearPointerListeners, resolveDrop],
  );

  const startPointerDrag = useCallback(
    (slotId: number, entry: InventoryEntry, clientX: number, clientY: number) => {
      clearPointerListeners();
      pendingRef.current = { slotId, entry, startX: clientX, startY: clientY };
      activeRef.current = false;

      const onPointerMove = (event: PointerEvent) => {
        const pending = pendingRef.current;
        if (!pending) return;

        if (!activeRef.current) {
          const dx = event.clientX - pending.startX;
          const dy = event.clientY - pending.startY;
          if (Math.hypot(dx, dy) < DRAG_START_THRESHOLD_PX) return;

          activeRef.current = true;
          const nextPayload: InventoryDragPayload = {
            slotId: pending.slotId,
            entry: pending.entry,
            isPlantableSeed: isPlantableSeedEntry(pending.entry),
          };
          payloadRef.current = nextPayload;
          setPayload(nextPayload);
          setGhostPosition({ x: event.clientX, y: event.clientY });
          if (nextPayload.isPlantableSeed) {
            notifyEvent("seed-selected");
          }
          return;
        }

        setGhostPosition({ x: event.clientX, y: event.clientY });
      };

      const onPointerUp = (event: PointerEvent) => {
        if (activeRef.current) {
          endDrag(event.clientX, event.clientY);
          return;
        }

        clearPointerListeners();
        pendingRef.current = null;
      };

      const onPointerCancel = (event: PointerEvent) => {
        if (activeRef.current) {
          endDrag(event.clientX, event.clientY);
          return;
        }

        clearPointerListeners();
        pendingRef.current = null;
      };

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerCancel);

      finishPointerListeners.current = () => {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerCancel);
      };
    },
    [clearPointerListeners, endDrag, notifyEvent],
  );

  const shouldBlockClick = useCallback(() => {
    if (blockClickRef.current) {
      blockClickRef.current = false;
      return true;
    }
    return false;
  }, []);

  const value: DragContextValue = {
    isDragging: payload !== null,
    isDraggingSeed: payload?.isPlantableSeed ?? false,
    dragSourceSlotId: payload?.slotId ?? null,
    shouldBlockClick,
    startPointerDrag,
  };

  return (
    <DragContext.Provider value={value}>
      {children}
      {mounted && payload && ghostPosition
        ? createPortal(
            <DragGhost entry={payload.entry} x={ghostPosition.x} y={ghostPosition.y} />,
            document.body,
          )
        : null}
    </DragContext.Provider>
  );
}

export function useDrag() {
  const context = useContext(DragContext);
  if (!context) {
    throw new Error("useDrag must be used within DragProvider");
  }
  return context;
}
