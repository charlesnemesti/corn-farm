"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { findPlantedCrop, type PlantedCrop } from "@/lib/cropState";
import {
  clearAllSavedGameState,
  createInitialGameState,
  loadGameState,
  saveGameState,
  type GameState,
  type InventoryEntry,
} from "@/lib/gameState";
import { applyHarvestProgress } from "@/lib/harvestProgress";
import { CORN_SEED_ITEM } from "@/lib/itemConfig";
import { getLevelFromTotalXp } from "@/lib/levelConfig";
import { SEED_STATS } from "@/lib/seedConfig";
import {
  canPurchasePlotRow,
  getPlotUnlockConfig,
  isPlotRowUnlocked,
  normalizeUnlockedPlotIds,
  type UnlockPlotResult,
} from "@/lib/plotUnlock";
import {
  canFitOpenedSeeds,
  type RolledSeed,
  SEEDS_PER_PACK,
} from "@/lib/seedConfig";
import type { ShopItem } from "@/lib/shopConfig";
import { TUTORIAL_HARVEST_WAIT_MS, clearTutorialCompleted } from "@/lib/tutorialConfig";
import { clearTreasuryState } from "@/lib/treasuryState";

type BuyResult = "success" | "insufficient-corn" | "inventory-full";
type CommitSeedsResult = "success" | "inventory-full" | "invalid-pack";
type PlantResult = "success" | "no-seed-selected" | "slot-unavailable" | "invalid-seed";

type GameContextValue = {
  corn: number;
  xp: number;
  inventory: (InventoryEntry | null)[];
  plantedCrops: PlantedCrop[];
  unlockedPlotIds: number[];
  playerLevel: number;
  plantingSeedSlot: number | null;
  now: number;
  hydrated: boolean;
  buyItem: (item: ShopItem) => BuyResult;
  canOpenSeedPack: (slotIndex: number) => boolean;
  commitOpenedSeeds: (packSlotIndex: number, seeds: RolledSeed[]) => CommitSeedsResult;
  selectPlantingSeed: (inventorySlotIndex: number | null) => void;
  plantSelectedSeed: (plotId: number, slotId: number) => PlantResult;
  plantSeedFromSlot: (
    inventorySlotIndex: number,
    plotId: number,
    slotId: number,
  ) => PlantResult;
  moveInventoryItem: (fromSlot: number, toSlot: number) => boolean;
  isSlotPlantable: (plotId: number, slotId: number) => boolean;
  isPlotRowUnlocked: (plotId: number) => boolean;
  unlockPlotRow: (plotId: number) => UnlockPlotResult;
  getCropAt: (plotId: number, slotId: number) => PlantedCrop | undefined;
  uprootCrop: (plotId: number, slotId: number) => boolean;
  discardInventoryItem: (slotIndex: number) => boolean;
  accelerateCropCycle: (plotId: number, slotId: number) => void;
  resetSavedGame: () => void;
  addDebugCorn: (amount: number) => void;
  addDebugXp: (amount: number) => void;
  creditTreasuryCorn: (amount: number) => void;
  debitTreasuryCorn: (amount: number) => boolean;
};

const GameContext = createContext<GameContextValue | null>(null);

function persistState(state: GameState) {
  saveGameState(state);
}

function isPlantableSeed(entry: InventoryEntry | null): entry is InventoryEntry {
  return (
    entry !== null &&
    entry.itemId === CORN_SEED_ITEM.id &&
    entry.rarity !== undefined
  );
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(() => createInitialGameState());
  const stateRef = useRef(state);
  const [plantingSeedSlot, setPlantingSeedSlot] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [hydrated, setHydrated] = useState(false);

  stateRef.current = state;

  useEffect(() => {
    const saved = loadGameState();
    if (saved) {
      setState(saved);
      saveGameState(saved);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timerId = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timerId);
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;

    const syncProgress = (currentTime = Date.now()) => {
      setState((prev) => {
        const { state: next } = applyHarvestProgress(prev, currentTime);
        if (next === prev) return prev;
        saveGameState(next, currentTime);
        return next;
      });
      setNow(currentTime);
    };

    const handlePageHide = () => {
      saveGameState(stateRef.current);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncProgress();
        return;
      }
      saveGameState(stateRef.current);
    };

    window.addEventListener("pagehide", handlePageHide);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;

    const currentTime = Date.now();

    setState((prev) => {
      const { state: next } = applyHarvestProgress(prev, currentTime);
      if (next === prev) return prev;
      saveGameState(next, currentTime);
      return next;
    });
  }, [hydrated, now]);

  const buyItem = useCallback((item: ShopItem): BuyResult => {
    let result: BuyResult = "success";

    setState((prev) => {
      if (prev.corn < item.priceCorn) {
        result = "insufficient-corn";
        return prev;
      }

      const emptySlotIndex = prev.inventory.findIndex((entry) => entry === null);
      if (emptySlotIndex === -1) {
        result = "inventory-full";
        return prev;
      }

      const nextInventory = [...prev.inventory];
      nextInventory[emptySlotIndex] = { itemId: item.id, quantity: 1 };

      const next: GameState = {
        ...prev,
        corn: prev.corn - item.priceCorn,
        inventory: nextInventory,
      };
      persistState(next);
      return next;
    });

    return result;
  }, []);

  const canOpenSeedPack = useCallback(
    (slotIndex: number) => canFitOpenedSeeds(state.inventory, slotIndex),
    [state.inventory],
  );

  const commitOpenedSeeds = useCallback(
    (packSlotIndex: number, seeds: RolledSeed[]): CommitSeedsResult => {
      let result: CommitSeedsResult = "success";

      setState((prev) => {
        if (seeds.length !== SEEDS_PER_PACK) {
          result = "invalid-pack";
          return prev;
        }

        if (!canFitOpenedSeeds(prev.inventory, packSlotIndex)) {
          result = "inventory-full";
          return prev;
        }

        const emptySlots = prev.inventory
          .map((entry, index) => (entry === null ? index : -1))
          .filter((index) => index >= 0);

        const targetSlots = [
          packSlotIndex,
          ...emptySlots.filter((index) => index !== packSlotIndex),
        ].slice(0, SEEDS_PER_PACK);

        const nextInventory = [...prev.inventory];
        for (const slot of targetSlots) {
          nextInventory[slot] = null;
        }

        seeds.forEach((seed, index) => {
          nextInventory[targetSlots[index]] = {
            itemId: CORN_SEED_ITEM.id,
            quantity: 1,
            rarity: seed.rarity,
          };
        });

        const next: GameState = { ...prev, inventory: nextInventory };
        persistState(next);
        return next;
      });

      return result;
    },
    [],
  );

  const selectPlantingSeed = useCallback((inventorySlotIndex: number | null) => {
    setPlantingSeedSlot((current) =>
      inventorySlotIndex !== null && current === inventorySlotIndex
        ? null
        : inventorySlotIndex,
    );
  }, []);

  const isPlotRowUnlockedForState = useCallback(
    (plotId: number) => isPlotRowUnlocked(plotId, state.unlockedPlotIds),
    [state.unlockedPlotIds],
  );

  const isSlotPlantable = useCallback(
    (plotId: number, slotId: number) => {
      if (!isPlotRowUnlocked(plotId, state.unlockedPlotIds)) return false;
      if (findPlantedCrop(state.plantedCrops, plotId, slotId)) return false;
      return true;
    },
    [state.plantedCrops, state.unlockedPlotIds],
  );

  const getCropAt = useCallback(
    (plotId: number, slotId: number) =>
      findPlantedCrop(state.plantedCrops, plotId, slotId),
    [state.plantedCrops],
  );

  const plantSeedAt = useCallback(
    (
      prev: GameState,
      inventorySlot: number,
      plotId: number,
      slotId: number,
    ): { next: GameState; result: PlantResult } => {
      const seedEntry = prev.inventory[inventorySlot];
      if (!isPlantableSeed(seedEntry)) {
        return { next: prev, result: "invalid-seed" };
      }

      if (!isPlotRowUnlocked(plotId, prev.unlockedPlotIds)) {
        return { next: prev, result: "slot-unavailable" };
      }

      if (findPlantedCrop(prev.plantedCrops, plotId, slotId)) {
        return { next: prev, result: "slot-unavailable" };
      }

      const nextInventory = [...prev.inventory];
      if (seedEntry.quantity > 1) {
        nextInventory[inventorySlot] = {
          ...seedEntry,
          quantity: seedEntry.quantity - 1,
        };
      } else {
        nextInventory[inventorySlot] = null;
      }

      const next: GameState = {
        ...prev,
        inventory: nextInventory,
        plantedCrops: [
          ...prev.plantedCrops,
          {
            plotId,
            slotId,
            rarity: seedEntry.rarity!,
            cycleStartedAt: Date.now(),
          },
        ],
      };

      return { next, result: "success" };
    },
    [],
  );

  const plantSelectedSeed = useCallback(
    (plotId: number, slotId: number): PlantResult => {
      if (plantingSeedSlot === null) return "no-seed-selected";

      let result: PlantResult = "success";

      setState((prev) => {
        const planted = plantSeedAt(prev, plantingSeedSlot, plotId, slotId);
        result = planted.result;
        if (planted.result !== "success") return prev;

        persistState(planted.next);
        return planted.next;
      });

      if (result === "success") {
        setPlantingSeedSlot(null);
      }

      return result;
    },
    [plantSeedAt, plantingSeedSlot],
  );

  const plantSeedFromSlot = useCallback(
    (inventorySlot: number, plotId: number, slotId: number): PlantResult => {
      let result: PlantResult = "success";

      setState((prev) => {
        const planted = plantSeedAt(prev, inventorySlot, plotId, slotId);
        result = planted.result;
        if (planted.result !== "success") return prev;

        persistState(planted.next);
        return planted.next;
      });

      if (result === "success") {
        setPlantingSeedSlot((current) =>
          current === inventorySlot ? null : current,
        );
      }

      return result;
    },
    [plantSeedAt],
  );

  const moveInventoryItem = useCallback((fromSlot: number, toSlot: number): boolean => {
    if (fromSlot === toSlot) return false;

    let moved = false;

    setState((prev) => {
      if (fromSlot < 0 || toSlot < 0 || fromSlot >= prev.inventory.length) {
        return prev;
      }
      if (toSlot >= prev.inventory.length) return prev;

      const fromEntry = prev.inventory[fromSlot];
      if (!fromEntry) return prev;

      moved = true;
      const nextInventory = [...prev.inventory];
      const toEntry = nextInventory[toSlot];
      nextInventory[toSlot] = fromEntry;
      nextInventory[fromSlot] = toEntry ?? null;

      const next: GameState = {
        ...prev,
        inventory: nextInventory,
      };
      persistState(next);
      return next;
    });

    if (moved) {
      setPlantingSeedSlot((current) => {
        if (current === fromSlot) return toSlot;
        if (current === toSlot) return fromSlot;
        return current;
      });
    }

    return moved;
  }, []);

  const uprootCrop = useCallback((plotId: number, slotId: number): boolean => {
    let removed = false;

    setState((prev) => {
      const cropIndex = prev.plantedCrops.findIndex(
        (crop) => crop.plotId === plotId && crop.slotId === slotId,
      );
      if (cropIndex === -1) return prev;

      removed = true;
      const next: GameState = {
        ...prev,
        plantedCrops: prev.plantedCrops.filter((_, index) => index !== cropIndex),
      };
      persistState(next);
      return next;
    });

    return removed;
  }, []);

  const accelerateCropCycle = useCallback((plotId: number, slotId: number) => {
    setState((prev) => {
      const cropIndex = prev.plantedCrops.findIndex(
        (crop) => crop.plotId === plotId && crop.slotId === slotId,
      );
      if (cropIndex === -1) return prev;

      const crop = prev.plantedCrops[cropIndex];
      const cycleMs = SEED_STATS[crop.rarity].harvestCycleSeconds * 1000;
      const acceleratedStart =
        Date.now() - cycleMs + TUTORIAL_HARVEST_WAIT_MS;

      const nextCrops = [...prev.plantedCrops];
      nextCrops[cropIndex] = {
        ...crop,
        cycleStartedAt: acceleratedStart,
      };

      const next: GameState = { ...prev, plantedCrops: nextCrops };
      persistState(next);
      return next;
    });
  }, []);

  const discardInventoryItem = useCallback((slotIndex: number): boolean => {
    let discarded = false;

    setState((prev) => {
      if (slotIndex < 0 || slotIndex >= prev.inventory.length) return prev;
      if (prev.inventory[slotIndex] === null) return prev;

      discarded = true;
      const nextInventory = [...prev.inventory];
      nextInventory[slotIndex] = null;

      const next: GameState = {
        ...prev,
        inventory: nextInventory,
      };
      persistState(next);
      return next;
    });

    if (discarded) {
      setPlantingSeedSlot((current) => (current === slotIndex ? null : current));
    }

    return discarded;
  }, []);

  const unlockPlotRow = useCallback((plotId: number): UnlockPlotResult => {
    let result: UnlockPlotResult = "success";

    setState((prev) => {
      const playerLevel = getLevelFromTotalXp(prev.xp);
      const check = canPurchasePlotRow(
        plotId,
        prev.unlockedPlotIds,
        playerLevel,
        prev.corn,
      );

      if (!check.ok) {
        result = check.reason;
        return prev;
      }

      const config = getPlotUnlockConfig(plotId);
      if (!config) {
        result = "invalid-plot";
        return prev;
      }

      const next: GameState = {
        ...prev,
        corn: prev.corn - config.cornCost,
        unlockedPlotIds: normalizeUnlockedPlotIds([...prev.unlockedPlotIds, plotId]),
      };
      persistState(next);
      return next;
    });

    return result;
  }, []);

  const resetSavedGame = useCallback(() => {
    clearAllSavedGameState();
    clearTreasuryState();
    clearTutorialCompleted();
    const fresh = createInitialGameState();
    setState(fresh);
    setPlantingSeedSlot(null);
    saveGameState(fresh);
  }, []);

  const creditTreasuryCorn = useCallback((amount: number) => {
    if (amount <= 0) return;

    setState((prev) => {
      const next: GameState = {
        ...prev,
        corn: prev.corn + amount,
      };
      persistState(next);
      return next;
    });
  }, []);

  const debitTreasuryCorn = useCallback((amount: number) => {
    if (amount <= 0) return false;

    let debited = false;

    setState((prev) => {
      if (prev.corn < amount) return prev;

      debited = true;
      const next: GameState = {
        ...prev,
        corn: prev.corn - amount,
      };
      persistState(next);
      return next;
    });

    return debited;
  }, []);

  const addDebugCorn = useCallback((amount: number) => {
    if (amount <= 0) return;

    setState((prev) => {
      const next: GameState = {
        ...prev,
        corn: prev.corn + amount,
      };
      persistState(next);
      return next;
    });
  }, []);

  const addDebugXp = useCallback((amount: number) => {
    if (amount <= 0) return;

    setState((prev) => {
      const next: GameState = {
        ...prev,
        xp: prev.xp + amount,
      };
      persistState(next);
      return next;
    });
  }, []);

  const playerLevel = getLevelFromTotalXp(state.xp);

  const value = useMemo(
    () => ({
      corn: state.corn,
      xp: state.xp,
      inventory: state.inventory,
      plantedCrops: state.plantedCrops,
      unlockedPlotIds: state.unlockedPlotIds,
      playerLevel,
      plantingSeedSlot,
      now,
      hydrated,
      buyItem,
      canOpenSeedPack,
      commitOpenedSeeds,
      selectPlantingSeed,
      plantSelectedSeed,
      plantSeedFromSlot,
      moveInventoryItem,
      isSlotPlantable,
      isPlotRowUnlocked: isPlotRowUnlockedForState,
      unlockPlotRow,
      getCropAt,
      uprootCrop,
      discardInventoryItem,
      accelerateCropCycle,
      resetSavedGame,
      addDebugCorn,
      addDebugXp,
      creditTreasuryCorn,
      debitTreasuryCorn,
    }),
    [
      addDebugCorn,
      addDebugXp,
      accelerateCropCycle,
      buyItem,
      canOpenSeedPack,
      commitOpenedSeeds,
      creditTreasuryCorn,
      debitTreasuryCorn,
      discardInventoryItem,
      getCropAt,
      hydrated,
      isPlotRowUnlockedForState,
      isSlotPlantable,
      moveInventoryItem,
      now,
      plantSelectedSeed,
      plantSeedFromSlot,
      plantingSeedSlot,
      playerLevel,
      resetSavedGame,
      selectPlantingSeed,
      state.corn,
      state.inventory,
      state.plantedCrops,
      state.unlockedPlotIds,
      state.xp,
      unlockPlotRow,
      uprootCrop,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within GameProvider");
  }
  return context;
}
