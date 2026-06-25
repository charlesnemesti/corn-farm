// NOTE: All code must stay in English, even when requirements arrive in Spanish.

import {
  Connection,
  PublicKey,
  Transaction,
  type TransactionSignature,
} from "@solana/web3.js";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  cornToRawAmount,
  getCornMintPublicKey,
  MIN_DEPOSIT_CORN,
  MIN_WITHDRAW_CORN,
  WITHDRAW_COOLDOWN_MS,
  WITHDRAW_MIN_LEVEL,
  getTreasuryPublicKey,
} from "./treasuryConfig";

export type TreasuryBlockReason =
  | "wallet-not-connected"
  | "treasury-not-configured"
  | "mint-not-configured"
  | "invalid-deposit-amount"
  | "invalid-withdraw-amount"
  | "level-too-low"
  | "insufficient-corn"
  | "cooldown-active"
  | "demo-mode";

export async function buildCornDepositTransaction(
  connection: Connection,
  fromPubkey: PublicKey,
  treasuryPubkey: PublicKey,
  depositCorn: number,
): Promise<Transaction> {
  const mintPubkey = getCornMintPublicKey();
  if (!mintPubkey) {
    throw new Error("$CORN mint is not configured.");
  }

  if (!Number.isFinite(depositCorn) || depositCorn < MIN_DEPOSIT_CORN) {
    throw new Error(`Minimum deposit is ${MIN_DEPOSIT_CORN} $CORN.`);
  }

  const senderAta = getAssociatedTokenAddressSync(mintPubkey, fromPubkey);
  const treasuryAta = getAssociatedTokenAddressSync(mintPubkey, treasuryPubkey);
  const amountRaw = cornToRawAmount(depositCorn);

  const transaction = new Transaction();

  const treasuryAtaInfo = await connection.getAccountInfo(treasuryAta);
  if (!treasuryAtaInfo) {
    transaction.add(
      createAssociatedTokenAccountIdempotentInstruction(
        fromPubkey,
        treasuryAta,
        treasuryPubkey,
        mintPubkey,
      ),
    );
  }

  transaction.add(
    createTransferInstruction(
      senderAta,
      treasuryAta,
      fromPubkey,
      amountRaw,
      [],
      TOKEN_PROGRAM_ID,
    ),
  );

  return transaction;
}

export async function verifyCornDepositTransaction(
  connection: Connection,
  signature: TransactionSignature,
  expectedSender: PublicKey,
  treasuryPubkey: PublicKey,
  expectedCorn: number,
): Promise<boolean> {
  const mintPubkey = getCornMintPublicKey();
  if (!mintPubkey) return false;

  const expectedRaw = cornToRawAmount(expectedCorn);
  const response = await connection.getTransaction(signature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });

  if (!response?.meta || response.meta.err) return false;

  const mint = mintPubkey.toBase58();
  const sender = expectedSender.toBase58();
  const treasury = treasuryPubkey.toBase58();

  const pre = response.meta.preTokenBalances ?? [];
  const post = response.meta.postTokenBalances ?? [];

  const getBalance = (
    balances: typeof pre,
    owner: string,
  ): bigint => {
    const entry = balances.find(
      (balance) => balance.mint === mint && balance.owner === owner,
    );
    if (!entry) return BigInt(0);
    return BigInt(entry.uiTokenAmount.amount);
  };

  const senderDelta =
    getBalance(post, sender) - getBalance(pre, sender);
  const treasuryDelta =
    getBalance(post, treasury) - getBalance(pre, treasury);

  return senderDelta === -expectedRaw && treasuryDelta === expectedRaw;
}

export function getWithdrawBlockReason(
  playerLevel: number,
  corn: number,
  lastWithdrawAt: number,
  now: number,
  withdrawCorn: number,
): TreasuryBlockReason | null {
  if (playerLevel < WITHDRAW_MIN_LEVEL) return "level-too-low";
  if (!Number.isFinite(withdrawCorn) || withdrawCorn < MIN_WITHDRAW_CORN) {
    return "invalid-withdraw-amount";
  }
  if (corn < withdrawCorn) return "insufficient-corn";

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
    case "mint-not-configured":
      return "$CORN mint is not configured. Set NEXT_PUBLIC_CORN_MINT.";
    case "invalid-deposit-amount":
      return `Enter at least ${MIN_DEPOSIT_CORN} $CORN to deposit.`;
    case "invalid-withdraw-amount":
      return `Enter at least ${MIN_WITHDRAW_CORN} $CORN to withdraw.`;
    case "demo-mode":
      return "Switch to wallet mode to deposit or withdraw.";
    case "level-too-low":
      return `Reach level ${WITHDRAW_MIN_LEVEL} to unlock withdrawals. The treasury needs time for team seeding and player deposits before SPL can leave the pool.`;
    case "insufficient-corn":
      return "Not enough in-game $CORN for this withdrawal.";
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
