// NOTE: All code must stay in English, even when requirements arrive in Spanish.

import type { GameState } from "./gameState";
import { isValidGameState } from "./gameState";

export const WALLET_GAME_STORE_FILE = "wallet-game-states.json";

export type WalletGameStore = Record<string, GameState>;

export type WalletSavePayload = {
  wallet: string;
  state: GameState;
};

export function isValidWalletAddress(wallet: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet);
}

export function parseWalletSavePayload(body: unknown): WalletSavePayload | null {
  if (!body || typeof body !== "object") return null;
  const payload = body as WalletSavePayload;
  if (!isValidWalletAddress(payload.wallet)) return null;
  if (!isValidGameState(payload.state)) return null;
  return payload;
}

export async function fetchWalletGameState(wallet: string): Promise<GameState | null> {
  const response = await fetch(
    `/api/game/load?wallet=${encodeURIComponent(wallet)}`,
    { cache: "no-store" },
  );
  if (!response.ok) return null;

  const payload = (await response.json()) as { state?: GameState };
  if (!payload.state || !isValidGameState(payload.state)) return null;
  return payload.state;
}

export async function saveWalletGameState(
  wallet: string,
  state: GameState,
): Promise<boolean> {
  const response = await fetch("/api/game/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet, state }),
  });
  return response.ok;
}
