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
import { usePlayMode } from "@/context/PlayModeProvider";
import { useGame } from "@/context/GameProvider";
import { CORN_SEED_ITEM, isSeedPack } from "@/lib/itemConfig";
import {
  getTutorialStepConfig,
  loadTutorialCompleted,
  saveTutorialCompleted,
  type TutorialEvent,
  type TutorialStepId,
  type TutorialTargetId,
} from "@/lib/tutorialConfig";

type TutorialNotifyMeta = {
  plotId?: number;
  slotId?: number;
};

type TutorialContextValue = {
  active: boolean;
  completed: boolean;
  step: TutorialStepId;
  stepConfig: ReturnType<typeof getTutorialStepConfig>;
  isStep: (stepId: TutorialStepId) => boolean;
  isTargetStep: (target: TutorialTargetId) => boolean;
  notifyEvent: (event: TutorialEvent, meta?: TutorialNotifyMeta) => void;
  advanceWelcome: () => void;
  finishTutorial: () => void;
  skipTutorial: () => void;
  tutorialCrop: { plotId: number; slotId: number } | null;
};

const TutorialContext = createContext<TutorialContextValue | null>(null);

const STEP_ORDER: TutorialStepId[] = [
  "welcome",
  "open-shop",
  "buy-pack",
  "open-pack",
  "confirm-open",
  "collect-seeds",
  "select-seed",
  "plant-seed",
  "wait-harvest",
  "done",
];

const EVENT_TO_STEP: Partial<Record<TutorialEvent, TutorialStepId>> = {
  "shop-opened": "open-shop",
  "pack-purchased": "buy-pack",
  "pack-clicked": "open-pack",
  "pack-confirmed": "confirm-open",
  "seeds-collected": "collect-seeds",
  "seed-selected": "select-seed",
  "seed-planted": "plant-seed",
  "harvest-received": "wait-harvest",
};

export function TutorialProvider({ children }: { children: ReactNode }) {
  const { canPlay } = usePlayMode();
  const { hydrated, inventory, plantedCrops, accelerateCropCycle } = useGame();
  const [completed, setCompleted] = useState(true);
  const [hydratedTutorial, setHydratedTutorial] = useState(false);
  const [step, setStep] = useState<TutorialStepId>("welcome");
  const [tutorialCrop, setTutorialCrop] = useState<{
    plotId: number;
    slotId: number;
  } | null>(null);
  const tutorialCropRef = useRef<{ plotId: number; slotId: number } | null>(null);

  useEffect(() => {
    setCompleted(loadTutorialCompleted());
    setHydratedTutorial(true);
  }, []);

  const active =
    hydratedTutorial && hydrated && canPlay && !completed && step !== "done";

  const goToNextStep = useCallback((fromStep: TutorialStepId) => {
    const index = STEP_ORDER.indexOf(fromStep);
    if (index < 0 || index >= STEP_ORDER.length - 1) return;
    setStep(STEP_ORDER[index + 1]);
  }, []);

  const skipTutorial = useCallback(() => {
    saveTutorialCompleted();
    setCompleted(true);
    setStep("done");
    tutorialCropRef.current = null;
    setTutorialCrop(null);
  }, []);

  const finishTutorial = useCallback(() => {
    skipTutorial();
  }, [skipTutorial]);

  const notifyEvent = useCallback(
    (event: TutorialEvent, meta?: TutorialNotifyMeta) => {
      if (!active) return;

      const expectedStep = EVENT_TO_STEP[event];
      if (!expectedStep || step !== expectedStep) return;

      if (event === "seed-planted" && meta?.plotId !== undefined && meta?.slotId !== undefined) {
        const crop = { plotId: meta.plotId, slotId: meta.slotId };
        tutorialCropRef.current = crop;
        setTutorialCrop(crop);
        accelerateCropCycle(meta.plotId, meta.slotId);
      }

      if (event === "harvest-received") {
        setStep("done");
        return;
      }

      goToNextStep(expectedStep);
    },
    [active, accelerateCropCycle, goToNextStep, step],
  );

  const advanceWelcome = useCallback(() => {
    if (step === "welcome") {
      goToNextStep("welcome");
    }
  }, [goToNextStep, step]);

  useEffect(() => {
    if (!active) return;

    const hasPack = inventory.some(
      (entry) => entry !== null && isSeedPack(entry.itemId),
    );

    if (step === "buy-pack" && hasPack) {
      goToNextStep("buy-pack");
    }

    if (step === "plant-seed" && plantedCrops.length > 0) {
      const crop = plantedCrops[0];
      const coords = { plotId: crop.plotId, slotId: crop.slotId };
      tutorialCropRef.current = coords;
      setTutorialCrop(coords);
      accelerateCropCycle(crop.plotId, crop.slotId);
      goToNextStep("plant-seed");
    }
  }, [active, accelerateCropCycle, goToNextStep, inventory, plantedCrops, step]);

  const stepConfig = getTutorialStepConfig(step);

  const value = useMemo(
    () => ({
      active,
      completed,
      step,
      stepConfig,
      isStep: (stepId: TutorialStepId) => step === stepId,
      isTargetStep: (target: TutorialTargetId) => stepConfig.target === target,
      notifyEvent,
      advanceWelcome,
      finishTutorial,
      skipTutorial,
      tutorialCrop,
    }),
    [active, advanceWelcome, completed, finishTutorial, notifyEvent, skipTutorial, step, stepConfig, tutorialCrop],
  );

  return (
    <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error("useTutorial must be used within TutorialProvider");
  }
  return context;
}
