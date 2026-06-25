// NOTE: All code must stay in English, even when requirements arrive in Spanish.
// Central copy and figures for the public Docs page.

import { OFFLINE_HARVEST_CAP_MS } from "./harvestProgress";
import { INVENTORY_SLOT_COUNT } from "./inventoryBoard";
import { STARTING_CORN, WALLET_STARTING_CORN } from "./gameState";
import { PLOT_COUNT, SLOTS_PER_PLOT } from "./plotBoard";
import { PLOT_ROW_UNLOCKS } from "./plotUnlock";
import { DEMO_MAX_PLOT_ID } from "./playMode";
import {
  RARITY_DROP_WEIGHTS,
  SEEDS_PER_PACK,
  SEED_STATS,
  formatHarvestCycle,
} from "./seedConfig";
import { SEED_PACK_ITEM } from "./shopConfig";
import {
  WITHDRAW_MIN_LEVEL,
  WITHDRAW_COOLDOWN_MS,
  TOKENOMICS,
  formatCooldown,
} from "./treasuryConfig";
import { WEEKLY_PRIZE_TIERS } from "./leaderboard";

export type DocsSection = {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  subsections?: { title: string; body: string }[];
};

export type DocsNavGroup = {
  label: string;
  items: { id: string; label: string }[];
};

export const DOCS_NAV_GROUPS: DocsNavGroup[] = [
  {
    label: "Introduction",
    items: [
      { id: "overview", label: "Overview" },
      { id: "getting-started", label: "Getting started" },
    ],
  },
  {
    label: "Gameplay",
    items: [
      { id: "gameplay-loop", label: "Core loop" },
      { id: "farm-plots", label: "Farm & plots" },
      { id: "seeds-crops", label: "Seeds & crops" },
      { id: "inventory-shop", label: "Inventory & shop" },
      { id: "progression", label: "XP & levels" },
      { id: "offline", label: "Offline growth" },
    ],
  },
  {
    label: "Economy",
    items: [
      { id: "tokenomics", label: "$CORN & tokenomics" },
      { id: "treasury", label: "Treasury" },
      { id: "leaderboard", label: "Weekly leaderboard" },
    ],
  },
  {
    label: "Reference",
    items: [
      { id: "ui-controls", label: "UI & controls" },
      { id: "on-chain", label: "On-chain addresses" },
      { id: "risks", label: "Risks & FAQ" },
    ],
  },
];

export const DOCS_NAV = DOCS_NAV_GROUPS.flatMap((group) => group.items);

const offlineCapHours = OFFLINE_HARVEST_CAP_MS / (60 * 60 * 1000);

export const DOCS_SECTIONS: DocsSection[] = [
  {
    id: "overview",
    title: "Overview",
    paragraphs: [
      "SolFarm is a Web3 farm game on Solana. Plant corn seeds, harvest $CORN, unlock more land, and compete on the weekly production leaderboard.",
      "The in-game currency is $CORN — a fair-launch memecoin on pump.fun. Wallet mode links your on-chain balance to a custodied in-game balance backed by the treasury.",
    ],
  },
  {
    id: "getting-started",
    title: "Getting started",
    subsections: [
      {
        title: "Demo mode",
        body: `Free to try with ${STARTING_CORN.toLocaleString("en-US")} starting $CORN. Progress saves in your browser. Only row 1 (plot ${DEMO_MAX_PLOT_ID + 1}) is available — extra rows and treasury withdrawals require wallet mode.`,
      },
      {
        title: "Wallet mode",
        body: `Connect a Solana wallet (e.g. Phantom). You start with ${WALLET_STARTING_CORN} in-game $CORN until you deposit SPL $CORN from your wallet. Progress syncs to your wallet address. Required for treasury deposit/withdraw and the weekly leaderboard.`,
      },
      {
        title: "First steps",
        body: "Complete the tutorial if prompted. Buy a Seeds Pack from the villager shop, open it in your inventory, plant seeds on empty furrows, and wait for harvest cycles to complete automatically.",
      },
    ],
  },
  {
    id: "gameplay-loop",
    title: "Core gameplay loop",
    bullets: [
      "Earn or deposit $CORN",
      "Buy Seeds Packs from the seed shop NPC",
      "Open packs in your inventory to reveal 3 random seeds",
      "Select a seed and plant it on an empty plot slot",
      "Crops grow automatically and pay $CORN + XP each cycle",
      "Reinvest in more packs, unlock rows, and expand production",
    ],
  },
  {
    id: "farm-plots",
    title: "Farm & plots",
    paragraphs: [
      `The farm has ${PLOT_COUNT} rows × ${SLOTS_PER_PLOT} slots = ${PLOT_COUNT * SLOTS_PER_PLOT} planting spaces. Row 1 is free; additional rows unlock in order.`,
    ],
    subsections: PLOT_ROW_UNLOCKS.map((row) => ({
      title: `Row ${row.plotId + 1}`,
      body: `Requires player level ${row.minLevel} and ${row.cornCost.toLocaleString("en-US")} $CORN.`,
    })),
    bullets: [
      "Click a planted crop to uproot it (manual uproot does not return the seed).",
      "Demo mode cannot unlock rows beyond the starter row.",
    ],
  },
  {
    id: "seeds-crops",
    title: "Seeds & crops",
    paragraphs: [
      `Each Seeds Pack costs ${SEED_PACK_ITEM.priceCorn.toLocaleString("en-US")} $CORN and contains ${SEEDS_PER_PACK} seeds with random rarity.`,
      `Drop rates: Common ${RARITY_DROP_WEIGHTS.common}%, Rare ${RARITY_DROP_WEIGHTS.rare}%, Epic ${RARITY_DROP_WEIGHTS.epic}%.`,
    ],
    subsections: (["common", "rare", "epic"] as const).map((rarity) => ({
      title: rarity.charAt(0).toUpperCase() + rarity.slice(1),
      body: `${SEED_STATS[rarity].description} Cycle: ${formatHarvestCycle(SEED_STATS[rarity].harvestCycleSeconds)}. Reward: ${SEED_STATS[rarity].cornPerCycle} $CORN per cycle.`,
    })),
    bullets: [
      "Harvests complete automatically — no click required.",
      "Production per hour is shown in the game menu Stats section.",
    ],
  },
  {
    id: "inventory-shop",
    title: "Inventory & shop",
    paragraphs: [
      `Your backpack has ${INVENTORY_SLOT_COUNT} slots. Drag items to reorganize. Seed packs must be opened before planting.`,
      "The seed shop is marked on the farm — talk to the villager NPC to buy Seeds Packs.",
    ],
  },
  {
    id: "progression",
    title: "XP & levels",
    paragraphs: [
      "You earn XP every time a crop completes a harvest cycle. Higher rarity seeds grant more XP per cycle.",
      "Leveling unlocks new plot rows (see Farm & plots). Withdrawals from the treasury require level 10.",
    ],
    bullets: [
      "Common harvest: 10 XP per cycle",
      "Rare harvest: 25 XP per cycle",
      "Epic harvest: 50 XP per cycle",
      "XP per level increases progressively — check the menu Stats panel for your current level and progress.",
    ],
  },
  {
    id: "offline",
    title: "Offline growth",
    paragraphs: [
      `Crops keep growing while the tab is closed, up to ${offlineCapHours} hours of accrued harvests. When you return, completed cycles are applied automatically at the standard growth rate.`,
    ],
  },
  {
    id: "tokenomics",
    title: "$CORN & tokenomics",
    paragraphs: [
      TOKENOMICS.launchSummary,
      `Total supply: ${TOKENOMICS.totalSupply.toLocaleString("en-US")} ${TOKENOMICS.symbol} on ${TOKENOMICS.launchPlatform}.`,
      TOKENOMICS.graduation,
    ],
    bullets: TOKENOMICS.sinks.map((item) => item),
  },
  {
    id: "treasury",
    title: "Treasury",
    paragraphs: [
      TOKENOMICS.treasury.backsWithdrawals,
      TOKENOMICS.treasury.manualSeed,
      TOKENOMICS.treasury.organicGrowth,
      `Withdrawals unlock at level ${WITHDRAW_MIN_LEVEL}. ${TOKENOMICS.treasury.withdrawGateReason}`,
      `Withdrawal cooldown: ${formatCooldown(WITHDRAW_COOLDOWN_MS)} between on-chain withdrawals.`,
    ],
    bullets: TOKENOMICS.playerFlow.map((step) => `${step.label}: ${step.detail}`),
  },
  {
    id: "leaderboard",
    title: "Weekly leaderboard",
    paragraphs: [
      "Wallet mode players are ranked by $CORN/h production. Rankings reset every Monday 00:00 UTC.",
      "Open the game menu → Weekly rank to view standings and prizes.",
    ],
    subsections: WEEKLY_PRIZE_TIERS.map((tier) => ({
      title: tier.prizeLabel,
      body: `${tier.prizeCorn.toLocaleString("en-US")} $CORN prize (paid from treasury at season end).`,
    })),
  },
  {
    id: "ui-controls",
    title: "UI & controls",
    bullets: [
      "Header: wallet connect, treasury deposit/withdraw, music, Docs link",
      "Top right: $CORN balance",
      "Backpack button: open inventory to manage seeds and open packs",
      "Game menu: stats, production rate, XP, and leaderboard",
      "Plot slots: click empty furrow with a seed selected to plant; click crop to uproot",
      "Drag & drop: move inventory items between slots",
    ],
  },
  {
    id: "risks",
    title: "Risks & FAQ",
    bullets: [
      ...TOKENOMICS.risks,
      "Demo progress is browser-local — clearing site data may reset it.",
      "Wallet progress is tied to your connected address.",
      "Memecoins are volatile — never risk more than you can afford to lose.",
      "Verify treasury and mint addresses on Solscan before large deposits or withdrawals.",
    ],
    subsections: [
      {
        title: "Is demo $CORN real?",
        body: "No. Demo $CORN is practice currency only and cannot be withdrawn.",
      },
      {
        title: "Why is my withdrawal locked?",
        body: `You need player level ${WITHDRAW_MIN_LEVEL} and sufficient in-game balance. The treasury must hold enough SPL $CORN to fulfill the request.`,
      },
    ],
  },
];
