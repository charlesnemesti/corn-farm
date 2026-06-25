// NOTE: All code must stay in English, even when requirements arrive in Spanish.

import { Keypair } from "@solana/web3.js";

export function loadTreasuryKeypair(): Keypair | null {
  const secret = process.env.TREASURY_SECRET_KEY?.trim();
  if (!secret) return null;

  try {
    if (secret.startsWith("[")) {
      const bytes = Uint8Array.from(JSON.parse(secret) as number[]);
      return Keypair.fromSecretKey(bytes);
    }

    const decoded = Buffer.from(secret, "base64");
    if (decoded.length === 64) {
      return Keypair.fromSecretKey(decoded);
    }
  } catch {
    return null;
  }

  return null;
}
