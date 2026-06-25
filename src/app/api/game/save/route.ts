import { NextResponse } from "next/server";
import { applyHarvestProgress } from "@/lib/harvestProgress";
import { normalizeUnlockedPlotIds } from "@/lib/plotUnlock";
import {
  WALLET_GAME_STORE_FILE,
  parseWalletSavePayload,
  type WalletGameStore,
} from "@/lib/walletPersistence";
import { readJsonStore, writeJsonStore } from "@/lib/serverStore";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const payload = parseWalletSavePayload(body);
  if (!payload) {
    return NextResponse.json({ error: "Invalid wallet or game state." }, { status: 400 });
  }

  const { state: progressed } = applyHarvestProgress(payload.state);
  const normalized = {
    ...progressed,
    unlockedPlotIds: normalizeUnlockedPlotIds(progressed.unlockedPlotIds),
    lastProgressAt: Date.now(),
  };

  const store = await readJsonStore<WalletGameStore>(WALLET_GAME_STORE_FILE, {});
  store[payload.wallet] = normalized;
  await writeJsonStore(WALLET_GAME_STORE_FILE, store);

  return NextResponse.json({ ok: true, savedAt: Date.now() });
}
