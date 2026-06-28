/**
 * Withdraw SOL from the durable nonce account AXp2F7... and close it.
 * Must be signed by the nonce AUTHORITY (Hp2BK1...), not the nonce account key.
 *
 * Put the authority's private key in .env.local TEMPORARILY:
 *   NONCE_AUTHORITY_SECRET_KEY=<base58 | base64 | json byte array>
 *
 * Usage:
 *   npm run withdraw-nonce -- check
 *   npm run withdraw-nonce -- <DESTINATION_ADDRESS> all
 *   npm run withdraw-nonce -- <DESTINATION_ADDRESS> <AMOUNT_SOL>
 *
 * Delete NONCE_AUTHORITY_SECRET_KEY from .env.local right after.
 */
import {
  Connection,
  Keypair,
  NonceAccount,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import { getRpcEndpoint, loadEnvLocal } from "./env-local.mjs";

const LAMPORTS_PER_SOL = 1_000_000_000;
const NONCE_ACCOUNT = new PublicKey("AXp2F7NP3cKU7nP8HXXL1XKuSrj1JeAYj2im4JKvNyvj");

function loadAuthorityKeypair() {
  const secret = process.env.NONCE_AUTHORITY_SECRET_KEY?.trim();
  if (!secret) {
    console.error("✗ NONCE_AUTHORITY_SECRET_KEY is not set in .env.local");
    console.error("  Paste the Hp2BK1... authority private key there temporarily.");
    process.exit(1);
  }

  const candidates = [];
  if (secret.startsWith("[")) {
    try { candidates.push(Uint8Array.from(JSON.parse(secret))); } catch {}
  } else {
    try { candidates.push(bs58.decode(secret)); } catch {}
    try { candidates.push(Buffer.from(secret, "base64")); } catch {}
  }
  for (const bytes of candidates) {
    try {
      if (bytes.length === 64) return Keypair.fromSecretKey(bytes);
      if (bytes.length === 32) return Keypair.fromSeed(bytes);
    } catch {}
  }
  console.error("✗ NONCE_AUTHORITY_SECRET_KEY is invalid (expected base58, base64, or JSON byte array)");
  process.exit(1);
}

async function main() {
  loadEnvLocal();

  const destArg = process.argv[2]?.trim();
  const amountArg = process.argv[3]?.trim();
  const checkOnly = destArg?.toLowerCase() === "check";

  const connection = new Connection(getRpcEndpoint(), "confirmed");
  const info = await connection.getAccountInfo(NONCE_ACCOUNT);
  if (!info) {
    console.error("✗ Nonce account not found (already closed?)");
    process.exit(1);
  }
  const nonce = NonceAccount.fromAccountData(info.data);
  const balanceLamports = info.lamports;
  const balanceSol = balanceLamports / LAMPORTS_PER_SOL;

  const authority = loadAuthorityKeypair();
  const matches = authority.publicKey.equals(nonce.authorizedPubkey);

  if (checkOnly) {
    console.log("Nonce withdraw check");
    console.log("  Nonce account:    ", NONCE_ACCOUNT.toBase58());
    console.log("  Balance:          ", balanceSol.toFixed(6), "SOL");
    console.log("  Nonce authority:  ", nonce.authorizedPubkey.toBase58());
    console.log("  Your key controls:", authority.publicKey.toBase58());
    console.log("  Match:", matches ? "✓ YES — can withdraw" : "✗ NO — wrong key");
    return;
  }

  if (!destArg || !amountArg) {
    console.error("Usage: npm run withdraw-nonce -- <DESTINATION_ADDRESS> <AMOUNT_SOL|all>");
    process.exit(1);
  }
  if (!matches) {
    console.error("✗ Your key is not the nonce authority. Cannot withdraw.");
    console.error("  Authority:", nonce.authorizedPubkey.toBase58());
    console.error("  Your key: ", authority.publicKey.toBase58());
    process.exit(1);
  }

  let destination;
  try {
    destination = new PublicKey(destArg);
  } catch {
    console.error("✗ Invalid destination address:", destArg);
    process.exit(1);
  }

  const lamports =
    amountArg.toLowerCase() === "all"
      ? balanceLamports
      : Math.round(Number(amountArg.replace(",", ".")) * LAMPORTS_PER_SOL);

  if (!Number.isFinite(lamports) || lamports <= 0 || lamports > balanceLamports) {
    console.error("✗ Invalid amount:", amountArg);
    process.exit(1);
  }

  console.log("Nonce withdraw");
  console.log("  From (nonce):", NONCE_ACCOUNT.toBase58());
  console.log("  Authority:   ", authority.publicKey.toBase58());
  console.log("  To:          ", destination.toBase58());
  console.log("  Amount:      ", (lamports / LAMPORTS_PER_SOL).toFixed(6), "SOL");
  console.log(lamports === balanceLamports ? "  (full balance — nonce account will be closed)" : "");

  const tx = new Transaction().add(
    SystemProgram.nonceWithdraw({
      noncePubkey: NONCE_ACCOUNT,
      authorizedPubkey: authority.publicKey,
      toPubkey: destination,
      lamports,
    }),
  );
  tx.feePayer = authority.publicKey;

  const signature = await sendAndConfirmTransaction(connection, tx, [authority]);
  console.log("");
  console.log("✓ Withdrawn");
  console.log("  Signature:", signature);
  console.log("  Solscan:   https://solscan.io/tx/" + signature);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
