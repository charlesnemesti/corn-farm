import { NextResponse } from "next/server";
import { createWalletInitialGameState } from "@/lib/gameState";
import { applyHarvestProgress } from "@/lib/harvestProgress";
import { normalizeUnlockedPlotIds } from "@/lib/plotUnlock";
import { isValidWalletAddress, WALLET_GAME_STORE_FILE, type WalletGameStore } from "@/lib/walletPersistence";
import { readJsonStore } from "@/lib/serverStore";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get("wallet")?.trim() ?? "";

  if (!isValidWalletAddress(wallet)) {
    return NextResponse.json({ error: "A valid wallet address is required." }, { status: 400 });
  }

  const store = await readJsonStore<WalletGameStore>(WALLET_GAME_STORE_FILE, {});
  const saved = store[wallet];

  if (!saved) {
    const fresh = createWalletInitialGameState();
    return NextResponse.json({ state: fresh, isNew: true });
  }

  const { state: progressed } = applyHarvestProgress(saved);
  const normalized = {
    ...progressed,
    unlockedPlotIds: normalizeUnlockedPlotIds(progressed.unlockedPlotIds),
  };

  return NextResponse.json({ state: normalized, isNew: false });
}
