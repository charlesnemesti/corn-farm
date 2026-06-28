import { Keypair } from "@solana/web3.js";

const keypair = Keypair.generate();

console.log("Treasury public key:");
console.log(keypair.publicKey.toBase58());
console.log("");
console.log("Add these to .env.local:");
console.log(`NEXT_PUBLIC_TREASURY_PUBKEY=${keypair.publicKey.toBase58()}`);
console.log(`TREASURY_SECRET_KEY=${JSON.stringify(Array.from(keypair.secretKey))}`);
console.log("");
console.log("Fund the treasury wallet:");
console.log("  SOL  — transaction fees (withdrawals + ATA creation)");
console.log("  SPL  — seed $CORN for withdrawals and leaderboard prizes");
console.log("");
console.log("After the official pump.fun $CORN mint is live:");
console.log("  npm run configure-token -- <MINT_CA>");
console.log("  npm run verify-treasury");
