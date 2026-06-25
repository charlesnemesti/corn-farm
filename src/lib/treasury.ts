// NOTE: All code must stay in English, even when requirements arrive in Spanish.

import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  type TransactionSignature,
} from "@solana/web3.js";
import {
  DEPOSIT_SOL_LAMPORTS,
  WITHDRAW_COOLDOWN_MS,
  WITHDRAW_CORN_COST,
  WITHDRAW_MIN_LEVEL,
  getTreasuryPublicKey,
} from "./treasuryConfig";

export type TreasuryBlockReason =
  | "wallet-not-connected"
  | "treasury-not-configured"
  | "level-too-low"
  | "insufficient-corn"
  | "cooldown-active"
  | "demo-mode";

export function buildDepositTransaction(
  fromPubkey: PublicKey,
  treasuryPubkey: PublicKey,
): Transaction {
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey: treasuryPubkey,
      lamports: DEPOSIT_SOL_LAMPORTS,
    }),
  );

  return transaction;
}

export async function verifyDepositTransaction(
  connection: Connection,
  signature: TransactionSignature,
  expectedSender: PublicKey,
  treasuryPubkey: PublicKey,
): Promise<boolean> {
  const response = await connection.getTransaction(signature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });

  if (!response?.meta || response.meta.err) return false;

  const accountKeys = response.transaction.message.getAccountKeys();
  const senderIndex = accountKeys.staticAccountKeys.findIndex((key) =>
    key.equals(expectedSender),
  );
  const treasuryIndex = accountKeys.staticAccountKeys.findIndex((key) =>
    key.equals(treasuryPubkey),
  );

  if (senderIndex < 0 || treasuryIndex < 0) return false;

  const preBalances = response.meta.preBalances;
  const postBalances = response.meta.postBalances;
  const senderDelta = postBalances[senderIndex] - preBalances[senderIndex];
  const treasuryDelta = postBalances[treasuryIndex] - preBalances[treasuryIndex];

  const fee = response.meta.fee ?? 0;
  const expectedSenderDelta = -(DEPOSIT_SOL_LAMPORTS + fee);

  return senderDelta === expectedSenderDelta && treasuryDelta === DEPOSIT_SOL_LAMPORTS;
}

export function getWithdrawBlockReason(
  playerLevel: number,
  corn: number,
  lastWithdrawAt: number,
  now: number,
): TreasuryBlockReason | null {
  if (playerLevel < WITHDRAW_MIN_LEVEL) return "level-too-low";
  if (corn < WITHDRAW_CORN_COST) return "insufficient-corn";

  if (lastWithdrawAt > 0 && now - lastWithdrawAt < WITHDRAW_COOLDOWN_MS) {
    return "cooldown-active";
  }

  return null;
}

export function getWithdrawCooldownRemaining(
  lastWithdrawAt: number,
  now: number,
): number {
  if (lastWithdrawAt <= 0) return 0;
  return Math.max(0, WITHDRAW_COOLDOWN_MS - (now - lastWithdrawAt));
}

export function getTreasuryBlockMessage(reason: TreasuryBlockReason): string {
  switch (reason) {
    case "wallet-not-connected":
      return "Connect your wallet to use the treasury.";
    case "treasury-not-configured":
      return "Treasury is not configured yet. Set NEXT_PUBLIC_TREASURY_PUBKEY.";
    case "demo-mode":
      return "Switch to wallet mode to deposit or withdraw.";
    case "level-too-low":
      return `Reach level ${WITHDRAW_MIN_LEVEL} to unlock withdrawals.`;
    case "insufficient-corn":
      return `You need ${WITHDRAW_CORN_COST.toLocaleString("en-US")} $CORN to withdraw.`;
    case "cooldown-active":
      return "Withdrawal cooldown is still active.";
    default:
      return "This action is not available right now.";
  }
}

export function assertTreasuryReady(): PublicKey {
  const treasuryPubkey = getTreasuryPublicKey();
  if (!treasuryPubkey) {
    throw new Error("Treasury public key is not configured.");
  }
  return treasuryPubkey;
}
