// NOTE: All code must stay in English, even when requirements arrive in Spanish.

import { TREASURY_STORAGE_KEY } from "./treasuryConfig";

export type WalletTreasuryState = {
  lastWithdrawAt: number;
  processedDepositSignatures: string[];
};

type TreasuryStore = Record<string, WalletTreasuryState>;

function emptyWalletState(): WalletTreasuryState {
  return {
    lastWithdrawAt: 0,
    processedDepositSignatures: [],
  };
}

function loadStore(): TreasuryStore {
  if (typeof window === "undefined") return {};

  try {
    const raw = localStorage.getItem(TREASURY_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};

    return parsed as TreasuryStore;
  } catch {
    localStorage.removeItem(TREASURY_STORAGE_KEY);
    return {};
  }
}

function saveStore(store: TreasuryStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TREASURY_STORAGE_KEY, JSON.stringify(store));
}

export function loadWalletTreasuryState(walletAddress: string): WalletTreasuryState {
  const store = loadStore();
  return store[walletAddress] ?? emptyWalletState();
}

export function saveWalletTreasuryState(
  walletAddress: string,
  state: WalletTreasuryState,
) {
  const store = loadStore();
  store[walletAddress] = {
    lastWithdrawAt: state.lastWithdrawAt,
    processedDepositSignatures: [...new Set(state.processedDepositSignatures)].slice(-50),
  };
  saveStore(store);
}

export function markDepositProcessed(walletAddress: string, signature: string) {
  const current = loadWalletTreasuryState(walletAddress);
  if (current.processedDepositSignatures.includes(signature)) return;

  saveWalletTreasuryState(walletAddress, {
    ...current,
    processedDepositSignatures: [...current.processedDepositSignatures, signature],
  });
}

export function isDepositProcessed(walletAddress: string, signature: string): boolean {
  return loadWalletTreasuryState(walletAddress).processedDepositSignatures.includes(
    signature,
  );
}

export function setLastWithdrawAt(walletAddress: string, timestamp: number) {
  const current = loadWalletTreasuryState(walletAddress);
  saveWalletTreasuryState(walletAddress, {
    ...current,
    lastWithdrawAt: timestamp,
  });
}

export function clearTreasuryState() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TREASURY_STORAGE_KEY);
}
