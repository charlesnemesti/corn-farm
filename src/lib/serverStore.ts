// NOTE: All code must stay in English, even when requirements arrive in Spanish.
// Lightweight JSON file persistence for server-side data (leaderboard, wallet saves).

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), ".data");

async function ensureDataDir() {
  await mkdir(DATA_DIR, { recursive: true });
}

function filePath(name: string): string {
  return path.join(DATA_DIR, name);
}

export async function readJsonStore<T>(filename: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(filePath(filename), "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeJsonStore<T>(filename: string, data: T): Promise<void> {
  await ensureDataDir();
  await writeFile(filePath(filename), JSON.stringify(data, null, 2), "utf-8");
}
