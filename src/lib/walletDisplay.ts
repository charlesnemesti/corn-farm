import type { PublicKey } from "@solana/web3.js";

export function formatWalletAddress(publicKey: PublicKey): string {
  const base58 = publicKey.toBase58();
  if (base58.length <= 8) return base58;
  return `${base58.slice(0, 4)}…${base58.slice(-4)}`;
}
