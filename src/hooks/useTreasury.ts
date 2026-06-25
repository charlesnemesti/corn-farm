"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useGame } from "@/context/GameProvider";
import { usePlayMode } from "@/context/PlayModeProvider";
import {
  DEPOSIT_CORN_REWARD,
  DEPOSIT_SOL_AMOUNT,
  WITHDRAW_CORN_COST,
  WITHDRAW_MIN_LEVEL,
  WITHDRAW_SOL_AMOUNT,
  formatCooldown,
  formatSolAmount,
  getTreasuryPublicKey,
} from "@/lib/treasuryConfig";
import {
  buildDepositTransaction,
  getTreasuryBlockMessage,
  getWithdrawBlockReason,
  getWithdrawCooldownRemaining,
  verifyDepositTransaction,
  type TreasuryBlockReason,
} from "@/lib/treasury";
import {
  isDepositProcessed,
  loadWalletTreasuryState,
  markDepositProcessed,
  setLastWithdrawAt,
} from "@/lib/treasuryState";

export type TreasuryAction = "deposit" | "withdraw";

export type TreasuryStatus = {
  type: "idle" | "loading" | "success" | "error";
  message: string;
};

export function useTreasury() {
  const { connection } = useConnection();
  const { connected, publicKey, sendTransaction } = useWallet();
  const { playMode } = usePlayMode();
  const {
    corn,
    playerLevel,
    now,
    hydrated,
    creditTreasuryCorn,
    debitTreasuryCorn,
  } = useGame();

  const [status, setStatus] = useState<TreasuryStatus>({
    type: "idle",
    message: "",
  });
  const [walletTreasuryState, setWalletTreasuryState] = useState(() =>
    publicKey ? loadWalletTreasuryState(publicKey.toBase58()) : null,
  );

  const walletAddress = publicKey?.toBase58() ?? null;
  const treasuryPubkey = getTreasuryPublicKey();
  const walletMode = playMode === "wallet";

  useEffect(() => {
    if (!walletAddress) {
      setWalletTreasuryState(null);
      return;
    }

    setWalletTreasuryState(loadWalletTreasuryState(walletAddress));
  }, [walletAddress, status.type]);

  const lastWithdrawAt = walletTreasuryState?.lastWithdrawAt ?? 0;
  const withdrawCooldownRemaining = getWithdrawCooldownRemaining(lastWithdrawAt, now);

  const withdrawBlockReason = useMemo(() => {
    if (!walletMode) return "demo-mode" as TreasuryBlockReason;
    if (!connected || !publicKey) return "wallet-not-connected" as TreasuryBlockReason;
    if (!treasuryPubkey) return "treasury-not-configured" as TreasuryBlockReason;

    return getWithdrawBlockReason(playerLevel, corn, lastWithdrawAt, now);
  }, [
    connected,
    corn,
    lastWithdrawAt,
    now,
    playerLevel,
    publicKey,
    treasuryPubkey,
    walletMode,
  ]);

  const canDeposit =
    hydrated &&
    walletMode &&
    connected &&
    publicKey !== null &&
    treasuryPubkey !== null &&
    status.type !== "loading";

  const canWithdraw = canDeposit && withdrawBlockReason === null;

  const deposit = useCallback(async () => {
    if (!publicKey || !treasuryPubkey) {
      setStatus({
        type: "error",
        message: getTreasuryBlockMessage("wallet-not-connected"),
      });
      return;
    }

    if (!walletMode) {
      setStatus({ type: "error", message: getTreasuryBlockMessage("demo-mode") });
      return;
    }

    setStatus({
      type: "loading",
      message: `Sending ${formatSolAmount(DEPOSIT_SOL_AMOUNT)}…`,
    });

    try {
      const transaction = buildDepositTransaction(publicKey, treasuryPubkey);
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);
      setStatus({ type: "loading", message: "Confirming deposit on-chain…" });

      await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        "confirmed",
      );

      if (isDepositProcessed(publicKey.toBase58(), signature)) {
        setStatus({
          type: "success",
          message: "Deposit already credited for this transaction.",
        });
        return;
      }

      const verified = await verifyDepositTransaction(
        connection,
        signature,
        publicKey,
        treasuryPubkey,
      );

      if (!verified) {
        setStatus({
          type: "error",
          message: "Deposit transaction could not be verified.",
        });
        return;
      }

      markDepositProcessed(publicKey.toBase58(), signature);
      creditTreasuryCorn(DEPOSIT_CORN_REWARD);

      setWalletTreasuryState(loadWalletTreasuryState(publicKey.toBase58()));
      setStatus({
        type: "success",
        message: `Deposited ${formatSolAmount(DEPOSIT_SOL_AMOUNT)} and received ${DEPOSIT_CORN_REWARD.toLocaleString("en-US")} $CORN.`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Deposit failed. Try again.";
      setStatus({ type: "error", message });
    }
  }, [
    connection,
    creditTreasuryCorn,
    publicKey,
    sendTransaction,
    treasuryPubkey,
    walletMode,
  ]);

  const withdraw = useCallback(async () => {
    if (!publicKey || !treasuryPubkey) {
      setStatus({
        type: "error",
        message: getTreasuryBlockMessage("wallet-not-connected"),
      });
      return;
    }

    if (!walletMode) {
      setStatus({ type: "error", message: getTreasuryBlockMessage("demo-mode") });
      return;
    }

    if (withdrawBlockReason) {
      setStatus({
        type: "error",
        message: getTreasuryBlockMessage(withdrawBlockReason),
      });
      return;
    }

    if (!debitTreasuryCorn(WITHDRAW_CORN_COST)) {
      setStatus({
        type: "error",
        message: getTreasuryBlockMessage("insufficient-corn"),
      });
      return;
    }

    setStatus({
      type: "loading",
      message: `Withdrawing ${formatSolAmount(WITHDRAW_SOL_AMOUNT)}…`,
    });

    try {
      const response = await fetch("/api/treasury/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: publicKey.toBase58() }),
      });

      const payload = (await response.json()) as {
        error?: string;
        signature?: string;
        remainingMs?: number;
      };

      if (!response.ok) {
        creditTreasuryCorn(WITHDRAW_CORN_COST);

        if (response.status === 429 && payload.remainingMs) {
          setStatus({
            type: "error",
            message: `Withdrawal cooldown active. Try again in ${formatCooldown(payload.remainingMs)}.`,
          });
          return;
        }

        setStatus({
          type: "error",
          message: payload.error ?? "Withdrawal failed. Your $CORN was restored.",
        });
        return;
      }

      const timestamp = Date.now();
      setLastWithdrawAt(publicKey.toBase58(), timestamp);
      setWalletTreasuryState(loadWalletTreasuryState(publicKey.toBase58()));

      setStatus({
        type: "success",
        message: `Withdrew ${WITHDRAW_CORN_COST.toLocaleString("en-US")} $CORN for ${formatSolAmount(WITHDRAW_SOL_AMOUNT)}.`,
      });
    } catch (error) {
      creditTreasuryCorn(WITHDRAW_CORN_COST);
      const message =
        error instanceof Error ? error.message : "Withdrawal failed. Your $CORN was restored.";
      setStatus({ type: "error", message });
    }
  }, [
    creditTreasuryCorn,
    debitTreasuryCorn,
    publicKey,
    treasuryPubkey,
    walletMode,
    withdrawBlockReason,
  ]);

  const clearStatus = useCallback(() => {
    setStatus({ type: "idle", message: "" });
  }, []);

  const withdrawHint = useMemo(() => {
    if (!walletMode) return "Available in wallet mode only.";
    if (!connected) return "Connect your wallet first.";
    if (!treasuryPubkey) return "Treasury wallet is not configured.";
    if (playerLevel < WITHDRAW_MIN_LEVEL) {
      return `Unlocks at level ${WITHDRAW_MIN_LEVEL}. You are level ${playerLevel}.`;
    }
    if (corn < WITHDRAW_CORN_COST) {
      return `Need ${WITHDRAW_CORN_COST.toLocaleString("en-US")} $CORN.`;
    }
    if (withdrawCooldownRemaining > 0) {
      return `Cooldown: ${formatCooldown(withdrawCooldownRemaining)} remaining.`;
    }
    return `Withdraw ${WITHDRAW_CORN_COST.toLocaleString("en-US")} $CORN for ${formatSolAmount(WITHDRAW_SOL_AMOUNT)}.`;
  }, [
    connected,
    corn,
    playerLevel,
    treasuryPubkey,
    walletMode,
    withdrawCooldownRemaining,
  ]);

  return {
    canDeposit,
    canWithdraw,
    deposit,
    withdraw,
    status,
    clearStatus,
    withdrawBlockReason,
    withdrawCooldownRemaining,
    withdrawHint,
    depositRateLabel: `${DEPOSIT_CORN_REWARD.toLocaleString("en-US")} $CORN / ${formatSolAmount(DEPOSIT_SOL_AMOUNT)}`,
    withdrawRateLabel: `${WITHDRAW_CORN_COST.toLocaleString("en-US")} $CORN / ${formatSolAmount(WITHDRAW_SOL_AMOUNT)}`,
    withdrawMinLevel: WITHDRAW_MIN_LEVEL,
    playerLevel,
    isLoading: status.type === "loading",
  };
}
