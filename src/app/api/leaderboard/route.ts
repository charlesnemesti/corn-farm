import { NextResponse } from "next/server";
import {
  LEADERBOARD_STORE_FILE,
  LEADERBOARD_TOP_COUNT,
  createEmptyLeaderboardStore,
  getCurrentWeekId,
  getWeekEndTimestamp,
  normalizeLeaderboardStore,
  sortLeaderboard,
  type LeaderboardEntry,
  type LeaderboardStore,
} from "@/lib/leaderboard";
import { readJsonStore, writeJsonStore } from "@/lib/serverStore";

export const runtime = "nodejs";

type SubmitBody = {
  wallet?: string;
  cornPerHour?: number;
  playerLevel?: number;
  unlockedRows?: number;
  isFounder?: boolean;
};

function isValidWallet(wallet: string | undefined): wallet is string {
  return typeof wallet === "string" && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet);
}

async function loadStore(): Promise<LeaderboardStore> {
  const store = await readJsonStore<LeaderboardStore>(
    LEADERBOARD_STORE_FILE,
    createEmptyLeaderboardStore(),
  );
  return normalizeLeaderboardStore(store);
}

export async function GET() {
  const store = await loadStore();
  const ranked = sortLeaderboard(store.entries).slice(0, LEADERBOARD_TOP_COUNT);

  return NextResponse.json({
    weekId: store.weekId,
    weekEndsAt: getWeekEndTimestamp(),
    entries: ranked.map((entry, index) => ({
      rank: index + 1,
      ...entry,
    })),
  });
}

export async function POST(request: Request) {
  let body: SubmitBody;

  try {
    body = (await request.json()) as SubmitBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!isValidWallet(body.wallet)) {
    return NextResponse.json({ error: "A valid wallet address is required." }, { status: 400 });
  }

  const cornPerHour = body.cornPerHour;
  if (typeof cornPerHour !== "number" || !Number.isFinite(cornPerHour) || cornPerHour < 0) {
    return NextResponse.json({ error: "Invalid production rate." }, { status: 400 });
  }

  const playerLevel =
    typeof body.playerLevel === "number" && body.playerLevel >= 1 ? body.playerLevel : 1;
  const unlockedRows =
    typeof body.unlockedRows === "number" && body.unlockedRows >= 1 ? body.unlockedRows : 1;

  const store = await loadStore();
  const now = Date.now();
  const entry: LeaderboardEntry = {
    wallet: body.wallet,
    displayName: body.wallet,
    cornPerHour,
    playerLevel,
    unlockedRows,
    isFounder: body.isFounder === true,
    updatedAt: now,
  };

  const existingIndex = store.entries.findIndex((item) => item.wallet === body.wallet);
  if (existingIndex >= 0) {
    const existing = store.entries[existingIndex];
    if (cornPerHour <= existing.cornPerHour) {
      store.entries[existingIndex] = {
        ...existing,
        playerLevel,
        unlockedRows,
        isFounder: existing.isFounder || entry.isFounder,
        updatedAt: now,
      };
    } else {
      store.entries[existingIndex] = {
        ...entry,
        isFounder: existing.isFounder || entry.isFounder,
      };
    }
  } else {
    store.entries.push(entry);
  }

  await writeJsonStore(LEADERBOARD_STORE_FILE, store);

  const ranked = sortLeaderboard(store.entries);
  const rank = ranked.findIndex((item) => item.wallet === body.wallet) + 1;

  return NextResponse.json({ rank, weekId: store.weekId });
}
