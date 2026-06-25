// NOTE: All code must stay in English, even when requirements arrive in Spanish.

export const TUTORIAL_STORAGE_KEY = "solfarm-tutorial-v1";

/** Time until the tutorial crop is ready to harvest after planting. */
export const TUTORIAL_HARVEST_WAIT_MS = 12_000;

export type TutorialStepId =
  | "welcome"
  | "open-shop"
  | "buy-pack"
  | "open-pack"
  | "confirm-open"
  | "collect-seeds"
  | "select-seed"
  | "plant-seed"
  | "wait-harvest"
  | "done";

export type TutorialTargetId =
  | "villager"
  | "shop-buy"
  | "inventory-pack"
  | "confirm-open-pack"
  | "send-to-inventory"
  | "inventory-seed"
  | "furrow";

export type TutorialEvent =
  | "shop-opened"
  | "pack-purchased"
  | "pack-clicked"
  | "pack-confirmed"
  | "seeds-collected"
  | "seed-selected"
  | "seed-planted"
  | "harvest-received";

export type TutorialStepConfig = {
  id: TutorialStepId;
  title: string;
  body: string;
  target?: TutorialTargetId;
  stepLabel: string;
};

export const TUTORIAL_STEPS: TutorialStepConfig[] = [
  {
    id: "welcome",
    title: "Welcome to SolFarm!",
    body: "Let's walk through the core loop: buy seed packs, open them, plant seeds, and earn $CORN when crops finish growing.",
    stepLabel: "1 / 9",
  },
  {
    id: "open-shop",
    title: "Visit the seed shop",
    body: "Click the villager by the seed shop sign on the left side of the farm.",
    target: "villager",
    stepLabel: "2 / 9",
  },
  {
    id: "buy-pack",
    title: "Buy a Seeds Pack",
    body: "Purchase a Seeds Pack with your starting $CORN. It will go straight into your inventory.",
    target: "shop-buy",
    stepLabel: "3 / 9",
  },
  {
    id: "open-pack",
    title: "Open your pack",
    body: "Click the Seeds Pack in your inventory at the bottom of the screen.",
    target: "inventory-pack",
    stepLabel: "4 / 9",
  },
  {
    id: "confirm-open",
    title: "Confirm opening",
    body: "Confirm that you want to open the pack.",
    target: "confirm-open-pack",
    stepLabel: "5 / 9",
  },
  {
    id: "collect-seeds",
    title: "Collect your seeds",
    body: "Send the revealed seeds to your inventory.",
    target: "send-to-inventory",
    stepLabel: "6 / 9",
  },
  {
    id: "select-seed",
    title: "Select a seed",
    body: "Click one of your corn seeds in the inventory to equip it for planting.",
    target: "inventory-seed",
    stepLabel: "7 / 9",
  },
  {
    id: "plant-seed",
    title: "Plant the seed",
    body: "Click a glowing furrow on the top row to plant your seed.",
    target: "furrow",
    stepLabel: "8 / 9",
  },
  {
    id: "wait-harvest",
    title: "Harvest your crop",
    body: "Wait for the crop to finish growing. You'll earn $CORN automatically when the cycle completes.",
    target: "furrow",
    stepLabel: "9 / 9",
  },
  {
    id: "done",
    title: "You're ready to farm!",
    body: "That's the loop: buy packs, open seeds, plant, and harvest for $CORN. Keep expanding your farm!",
    stepLabel: "Done",
  },
];

export function getTutorialStepConfig(stepId: TutorialStepId): TutorialStepConfig {
  return TUTORIAL_STEPS.find((step) => step.id === stepId) ?? TUTORIAL_STEPS[0];
}

export function loadTutorialCompleted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(TUTORIAL_STORAGE_KEY) === "completed";
  } catch {
    return false;
  }
}

export function saveTutorialCompleted() {
  localStorage.setItem(TUTORIAL_STORAGE_KEY, "completed");
}

export function clearTutorialCompleted() {
  localStorage.removeItem(TUTORIAL_STORAGE_KEY);
}
