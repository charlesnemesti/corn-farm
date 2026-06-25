import { NextResponse } from "next/server";
import {
  LEADERBOARD_STORE_FILE,
  createEmptyLeaderboardStore,
  getPrizeForRank,
  getWeekEndTimestamp,
  normalizeLeaderboardStore,
  shortenWallet,
  sortLeaderboard,
  type LeaderboardStore,
} from "@/lib/leaderboard";
import { readJsonStore } from "@/lib/serverStore";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ wallet: string }>;
};

function isValidWallet(wallet: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet);
}

export async function GET(_request: Request, context: RouteContext) {
  const { wallet } = await context.params;

  if (!isValidWallet(wallet)) {
    return NextResponse.json({ error: "Invalid wallet address." }, { status: 400 });
  }

  const store = await readJsonStore<LeaderboardStore>(
    LEADERBOARD_STORE_FILE,
    createEmptyLeaderboardStore(),
  );
  const normalized = normalizeLeaderboardStore(store);
  const ranked = sortLeaderboard(normalized.entries);
  const index = ranked.findIndex((entry) => entry.wallet === wallet);

  if (index < 0) {
    return NextResponse.json({
      wallet,
      displayName: shortenWallet(wallet),
      rank: null,
      cornPerHour: 0,
      playerLevel: 1,
      unlockedRows: 1,
      isFounder: false,
      weekId: normalized.weekId,
      weekEndsAt: getWeekEndTimestamp(),
      projectedPrize: null,
    });
  }

  const entry = ranked[index];
  const rank = index + 1;
  const prize = getPrizeForRank(rank);

  return NextResponse.json({
    wallet: entry.wallet,
    displayName: shortenWallet(entry.wallet),
    rank,
    cornPerHour: entry.cornPerHour,
    playerLevel: entry.playerLevel,
    unlockedRows: entry.unlockedRows,
    isFounder: entry.isFounder,
    weekId: normalized.weekId,
    weekEndsAt: getWeekEndTimestamp(),
    projectedPrize: prize
      ? { label: prize.prizeLabel, corn: prize.prizeCorn }
      : null,
  });
}
