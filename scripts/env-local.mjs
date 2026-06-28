import fs from "node:fs";
import path from "node:path";

export const ENV_PATH = path.join(process.cwd(), ".env.local");

export function loadEnvLocal() {
  if (!fs.existsSync(ENV_PATH)) return;

  for (const line of fs.readFileSync(ENV_PATH, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

export function upsertEnvValue(key, value) {
  const lines = fs.existsSync(ENV_PATH)
    ? fs.readFileSync(ENV_PATH, "utf8").split("\n")
    : [];
  const nextLine = `${key}=${value}`;
  let replaced = false;

  const updated = lines.map((line) => {
    if (line.startsWith(`${key}=`)) {
      replaced = true;
      return nextLine;
    }
    return line;
  });

  if (!replaced) {
    if (updated.length > 0 && updated[updated.length - 1] !== "") {
      updated.push("");
    }
    updated.push(nextLine);
  }

  fs.writeFileSync(ENV_PATH, `${updated.join("\n").replace(/\n+$/, "\n")}`);
}

export function getRpcEndpoint() {
  if (process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim()) {
    return process.env.NEXT_PUBLIC_SOLANA_RPC_URL.trim();
  }

  const cluster = process.env.NEXT_PUBLIC_SOLANA_CLUSTER?.trim() ?? "mainnet-beta";
  if (cluster === "devnet") return "https://api.devnet.solana.com";
  if (cluster === "testnet") return "https://api.testnet.solana.com";
  return "https://api.mainnet-beta.solana.com";
}
