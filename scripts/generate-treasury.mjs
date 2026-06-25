import { Keypair } from "@solana/web3.js";

const keypair = Keypair.generate();

console.log("Treasury public key:");
console.log(keypair.publicKey.toBase58());
console.log("");
console.log("Add these to .env.local:");
console.log(`NEXT_PUBLIC_TREASURY_PUBKEY=${keypair.publicKey.toBase58()}`);
console.log(`TREASURY_SECRET_KEY=${JSON.stringify(Array.from(keypair.secretKey))}`);
console.log("");
console.log("Fund the treasury on devnet:");
console.log(`solana airdrop 2 ${keypair.publicKey.toBase58()} --url devnet`);
