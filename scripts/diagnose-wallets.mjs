import { Connection, PublicKey } from "@solana/web3.js";

const RPC = "https://api.mainnet-beta.solana.com";
const WALLETS = [
  ["AXp2F7NP3cKU7nP8HXXL1XKuSrj1JeAYj2im4JKvNyvj", "treasury pasted in Vercel"],
  ["Hp2BK1wmsHPgbxZ3rHA2okFGHBtpye1nXQUVD5aidzj9", "authority shown to user"],
  ["Exrd6MzRJ43XHqRanbw176rKwiaGLjsRHz5kGd8TyWJC", "a generate-treasury output"],
];

const conn = new Connection(RPC, "confirmed");

for (const [addr, label] of WALLETS) {
  try {
    const pk = new PublicKey(addr);
    const lamports = await conn.getBalance(pk);
    const info = await conn.getAccountInfo(pk);
    console.log(`${addr}`);
    console.log(`  (${label})`);
    console.log(`  SOL: ${(lamports / 1e9).toFixed(6)}`);
    console.log(`  owner program: ${info ? info.owner.toBase58() : "uninitialized / no account"}`);
    console.log("");
  } catch (e) {
    console.log(`${addr} — error: ${e.message}\n`);
  }
}
