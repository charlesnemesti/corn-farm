import { NextResponse } from "next/server";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  WITHDRAW_COOLDOWN_MS,
  WITHDRAW_SOL_LAMPORTS,
  getSolanaRpcEndpoint,
} from "@/lib/treasuryConfig";
import { loadTreasuryKeypair } from "@/lib/treasuryServer";

export const runtime = "nodejs";

const withdrawalTimestamps = new Map<string, number>();

type WithdrawRequest = {
  wallet?: string;
};

function parseWalletAddress(value: string | undefined): PublicKey | null {
  if (!value) return null;

  try {
    return new PublicKey(value);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  let body: WithdrawRequest;

  try {
    body = (await request.json()) as WithdrawRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const destination = parseWalletAddress(body.wallet);
  if (!destination) {
    return NextResponse.json({ error: "A valid wallet address is required." }, { status: 400 });
  }

  const treasuryKeypair = loadTreasuryKeypair();
  if (!treasuryKeypair) {
    return NextResponse.json(
      { error: "Treasury signer is not configured on the server." },
      { status: 503 },
    );
  }

  const walletKey = destination.toBase58();
  const lastWithdrawAt = withdrawalTimestamps.get(walletKey) ?? 0;
  const now = Date.now();

  if (lastWithdrawAt > 0 && now - lastWithdrawAt < WITHDRAW_COOLDOWN_MS) {
    return NextResponse.json(
      {
        error: "Withdrawal cooldown is still active.",
        remainingMs: WITHDRAW_COOLDOWN_MS - (now - lastWithdrawAt),
      },
      { status: 429 },
    );
  }

  const connection = new Connection(getSolanaRpcEndpoint(), "confirmed");
  const treasuryBalance = await connection.getBalance(treasuryKeypair.publicKey);

  if (treasuryBalance < WITHDRAW_SOL_LAMPORTS + 5000) {
    return NextResponse.json(
      { error: "Treasury does not have enough SOL for this withdrawal." },
      { status: 503 },
    );
  }

  try {
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: treasuryKeypair.publicKey,
        toPubkey: destination,
        lamports: WITHDRAW_SOL_LAMPORTS,
      }),
    );

    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [treasuryKeypair],
      { commitment: "confirmed" },
    );

    withdrawalTimestamps.set(walletKey, now);

    return NextResponse.json({ signature });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Withdrawal transaction failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
