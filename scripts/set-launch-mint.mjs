/**
 * Wire the official pump.fun $CORN mint at launch.
 * Treasury wallet + TREASURY_SECRET_KEY stay the same as test — only the mint changes.
 *
 * Usage: npm run set-launch-mint -- <OFFICIAL_PUMP_FUN_MINT_CA>
 */
import { Connection, PublicKey } from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getMint,
} from "@solana/spl-token";
import { getRpcEndpoint, loadEnvLocal, upsertEnvValue } from "./env-local.mjs";
import { LAUNCH_TREASURY_PUBKEY } from "./launch-constants.mjs";

async function resolveMintProgram(connection, mint) {
  const account = await connection.getAccountInfo(mint);
  if (account?.owner.equals(TOKEN_2022_PROGRAM_ID)) {
    return { programId: TOKEN_2022_PROGRAM_ID, kind: "token-2022" };
  }
  return { programId: TOKEN_PROGRAM_ID, kind: "spl" };
}

async function main() {
  loadEnvLocal();

  const mintAddress = process.argv[2]?.trim();
  if (!mintAddress) {
    console.error("Usage: npm run set-launch-mint -- <OFFICIAL_PUMP_FUN_MINT_CA>");
    console.error("");
    console.error("Example:");
    console.error("  npm run set-launch-mint -- 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU");
    process.exit(1);
  }

  if (mintAddress.startsWith("http://") || mintAddress.startsWith("https://")) {
    console.error("Invalid mint: pass the Solana mint address (base58), not a URL.");
    process.exit(1);
  }

  let mint;
  try {
    mint = new PublicKey(mintAddress);
  } catch {
    console.error("Invalid mint address:", mintAddress);
    process.exit(1);
  }

  const rpc = getRpcEndpoint();
  const connection = new Connection(rpc, "confirmed");

  console.log("Launch mint wiring");
  console.log("  RPC:", rpc);
  console.log("  Mint:", mint.toBase58());
  console.log("  Treasury (unchanged):", LAUNCH_TREASURY_PUBKEY);
  console.log("");

  const { programId, kind } = await resolveMintProgram(connection, mint);
  const mintInfo = await getMint(connection, mint, undefined, programId);

  upsertEnvValue("NEXT_PUBLIC_CORN_MINT", mint.toBase58());
  upsertEnvValue("NEXT_PUBLIC_CORN_DECIMALS", String(mintInfo.decimals));
  upsertEnvValue("NEXT_PUBLIC_CORN_TOKEN_PROGRAM", kind);
  upsertEnvValue("NEXT_PUBLIC_SOLANA_CLUSTER", "mainnet-beta");
  upsertEnvValue("NEXT_PUBLIC_TREASURY_PUBKEY", LAUNCH_TREASURY_PUBKEY);

  console.log("Updated .env.local:");
  console.log(`  NEXT_PUBLIC_CORN_MINT=${mint.toBase58()}`);
  console.log(`  NEXT_PUBLIC_CORN_DECIMALS=${mintInfo.decimals}`);
  console.log(`  NEXT_PUBLIC_CORN_TOKEN_PROGRAM=${kind}`);
  console.log(`  NEXT_PUBLIC_TREASURY_PUBKEY=${LAUNCH_TREASURY_PUBKEY}`);
  console.log(`  NEXT_PUBLIC_SOLANA_CLUSTER=mainnet-beta`);
  console.log("");
  console.log("On-chain mint:");
  console.log(`  Token program: ${kind}`);
  console.log(`  Decimals: ${mintInfo.decimals}`);
  console.log(`  Supply (raw): ${mintInfo.supply.toString()}`);
  console.log("");
  console.log("Vercel — update ONLY these (keep TREASURY_SECRET_KEY unchanged):");
  console.log(`  NEXT_PUBLIC_CORN_MINT=${mint.toBase58()}`);
  console.log(`  NEXT_PUBLIC_CORN_DECIMALS=${mintInfo.decimals}`);
  console.log(`  NEXT_PUBLIC_CORN_TOKEN_PROGRAM=${kind}`);
  console.log(`  NEXT_PUBLIC_TREASURY_PUBKEY=${LAUNCH_TREASURY_PUBKEY}`);
  console.log("");
  console.log("Then: Redeploy → fund treasury with SOL + $CORN → npm run verify-treasury");
  console.log("Check: GET /api/treasury/status → readyForDeposits: true");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
