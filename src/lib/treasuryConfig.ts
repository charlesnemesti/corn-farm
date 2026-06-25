// NOTE: All code must stay in English, even when requirements arrive in Spanish.

import { clusterApiUrl, PublicKey } from "@solana/web3.js";

export const LAMPORTS_PER_SOL = 1_000_000_000;

export const DEPOSIT_SOL_AMOUNT = 0.1;
export const DEPOSIT_SOL_LAMPORTS = 100_000_000;
export const DEPOSIT_CORN_REWARD = 1000;

export const WITHDRAW_SOL_AMOUNT = 0.1;
export const WITHDRAW_SOL_LAMPORTS = 100_000_000;
export const WITHDRAW_CORN_COST = 1200;
export const WITHDRAW_MIN_LEVEL = 5;
export const WITHDRAW_COOLDOWN_MS = 8 * 60 * 60 * 1000;

export const TREASURY_STORAGE_KEY = "solfarm-treasury-v1";

export function getSolanaRpcEndpoint(): string {
  return process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? clusterApiUrl("devnet");
}

export function getTreasuryPublicKey(): PublicKey | null {
  const address = process.env.NEXT_PUBLIC_TREASURY_PUBKEY?.trim();
  if (!address) return null;

  try {
    return new PublicKey(address);
  } catch {
    return null;
  }
}

export function formatSolAmount(sol: number): string {
  return `${sol.toLocaleString("en-US", { maximumFractionDigits: 2 })} SOL`;
}

export function formatCooldown(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}
