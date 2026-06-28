/**
 * Send SOL out of the treasury wallet (dev-only helper).
 * Signs with TREASURY_SECRET_KEY — the same key used for withdrawals.
 *
 * Usage:
 *   npm run send-treasury-sol -- check
 *   npm run send-treasury-sol -- <DESTINATION_ADDRESS> <AMOUNT_SOL>
 *   npm run send-treasury-sol -- <DESTINATION_ADDRESS> max
 *
 * "check" verifies the key matches the treasury and prints the balance (no send).
 * "max" sends everything except a safety buffer left for rent + fees.
 */
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import { getRpcEndpoint, loadEnvLocal } from "./env-local.mjs";
import { LAUNCH_TREASURY_PUBKEY } from "./launch-constants.mjs";

const LAMPORTS_PER_SOL = 1_000_000_000;
/** Left behind on "max" so the account stays rent-exempt and can pay the fee. */
const SAFETY_BUFFER_SOL = 0.01;

function loadTreasuryKeypair() {
  const secret = process.env.TREASURY_SECRET_KEY?.trim();
  if (!secret) {
    console.error("✗ TREASURY_SECRET_KEY is not set in .env.local");
    console.error("  Pull it from Vercel: vercel env pull .env.local");
    console.error("  (or paste TREASURY_SECRET_KEY=... into .env.local temporarily)");
    process.exit(1);
  }

  const candidates = [];
  if (secret.startsWith("[")) {
    try {
      candidates.push(Uint8Array.from(JSON.parse(secret)));
    } catch {
      // ignore
    }
  } else {
    // Phantom/Solflare export is base58; some tools use base64.
    try {
      candidates.push(bs58.decode(secret));
    } catch {
      // ignore
    }
    try {
      candidates.push(Buffer.from(secret, "base64"));
    } catch {
      // ignore
    }
  }

  for (const bytes of candidates) {
    try {
      if (bytes.length === 64) return Keypair.fromSecretKey(bytes);
      if (bytes.length === 32) return Keypair.fromSeed(bytes);
    } catch {
      // try next
    }
  }

  console.error("✗ TREASURY_SECRET_KEY is invalid (expected base58, base64, or JSON byte array)");
  process.exit(1);
}

async function main() {
  loadEnvLocal();

  const destArg = process.argv[2]?.trim();
  const amountArg = process.argv[3]?.trim();
  const checkOnly = destArg?.toLowerCase() === "check";

  if (!checkOnly && (!destArg || !amountArg)) {
    console.error("Usage:");
    console.error("  npm run send-treasury-sol -- check");
    console.error("  npm run send-treasury-sol -- <DESTINATION_ADDRESS> <AMOUNT_SOL|max>");
    process.exit(1);
  }

  const keypair = loadTreasuryKeypair();
  const derived = keypair.publicKey.toBase58();
  const matches = keypair.publicKey.equals(new PublicKey(LAUNCH_TREASURY_PUBKEY));

  const connection = new Connection(getRpcEndpoint(), "confirmed");
  const balanceLamports = await connection.getBalance(keypair.publicKey);
  const balanceSol = balanceLamports / LAMPORTS_PER_SOL;

  if (checkOnly) {
    console.log("Treasury key check");
    console.log("  Key controls wallet:", derived);
    console.log("  Expected treasury:  ", LAUNCH_TREASURY_PUBKEY);
    console.log("  Match:", matches ? "✓ YES" : "✗ NO");
    console.log("  Balance of key wallet:", balanceSol.toFixed(6), "SOL");
    if (!matches) {
      console.log("");
      console.log("  ⚠ This key does NOT control the treasury that holds the SOL.");
    }
    return;
  }

  let destination;
  try {
    destination = new PublicKey(destArg);
  } catch {
    console.error("✗ Invalid destination address:", destArg);
    process.exit(1);
  }

  if (!matches) {
    console.error("✗ TREASURY_SECRET_KEY does not match the treasury wallet");
    console.error("  Expected:", LAUNCH_TREASURY_PUBKEY);
    console.error("  Got:     ", derived);
    process.exit(1);
  }

  let lamportsToSend;
  if (amountArg.toLowerCase() === "max") {
    lamportsToSend = balanceLamports - Math.round(SAFETY_BUFFER_SOL * LAMPORTS_PER_SOL);
  } else {
    const amountSol = Number(amountArg.replace(",", "."));
    if (!Number.isFinite(amountSol) || amountSol <= 0) {
      console.error("✗ Invalid amount:", amountArg);
      process.exit(1);
    }
    lamportsToSend = Math.round(amountSol * LAMPORTS_PER_SOL);
  }

  if (lamportsToSend <= 0) {
    console.error("✗ Nothing to send after keeping the safety buffer.");
    process.exit(1);
  }

  console.log("Treasury SOL transfer");
  console.log("  From:  ", keypair.publicKey.toBase58());
  console.log("  To:    ", destination.toBase58());
  console.log("  Balance:", balanceSol.toFixed(6), "SOL");
  console.log("  Sending:", (lamportsToSend / LAMPORTS_PER_SOL).toFixed(6), "SOL");
  console.log("");

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: keypair.publicKey,
      toPubkey: destination,
      lamports: lamportsToSend,
    }),
  );

  const signature = await sendAndConfirmTransaction(connection, tx, [keypair]);
  console.log("✓ Sent");
  console.log("  Signature:", signature);
  console.log("  Solscan:   https://solscan.io/tx/" + signature);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
