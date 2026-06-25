"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useGame } from "@/context/GameProvider";
import { usePlayMode } from "@/context/PlayModeProvider";
import {
  MIN_DEPOSIT_CORN,
  MIN_WITHDRAW_CORN,
  WITHDRAW_MIN_LEVEL,
  formatCooldown,
  formatCornAmount,
  getCornMintPublicKey,
  getTreasuryPublicKey,
} from "@/lib/treasuryConfig";
import {
  buildCornDepositTransaction,
  getTreasuryBlockMessage,
  getWithdrawBlockReason,
  getWithdrawCooldownRemaining,
  verifyCornDepositTransaction,
  type TreasuryBlockReason,
} from "@/lib/treasury";
import {
  isDepositProcessed,
  loadWalletTreasuryState,
  markDepositProcessed,
  setLastWithdrawAt,
} from "@/lib/treasuryState";

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

  const [depositAmount, setDepositAmount] = useState(String(MIN_DEPOSIT_CORN * 100));
  const [withdrawAmount, setWithdrawAmount] = useState(String(MIN_WITHDRAW_CORN * 100));
  const [status, setStatus] = useState<TreasuryStatus>({
    type: "idle",
    message: "",
  });
  const [walletTreasuryState, setWalletTreasuryState] = useState(() =>
    publicKey ? loadWalletTreasuryState(publicKey.toBase58()) : null,
  );

  const walletAddress = publicKey?.toBase58() ?? null;
  const treasuryPubkey = getTreasuryPublicKey();
  const mintPubkey = getCornMintPublicKey();
  const walletMode = playMode === "wallet";

  const parsedDepositAmount = Number.parseFloat(depositAmount.replace(/,/g, ""));
  const depositAmountValid =
    Number.isFinite(parsedDepositAmount) && parsedDepositAmount >= MIN_DEPOSIT_CORN;

  const parsedWithdrawAmount = Number.parseFloat(withdrawAmount.replace(/,/g, ""));
  const withdrawAmountValid =
    Number.isFinite(parsedWithdrawAmount) && parsedWithdrawAmount >= MIN_WITHDRAW_CORN;

  useEffect(() => {
    if (!walletAddress) {
      setWalletTreasuryState(null);
      return;
    }

    setWalletTreasuryState(loadWalletTreasuryState(walletAddress));
  }, [walletAddress, status.type]);

  const lastWithdrawAt = walletTreasuryState?.lastWithdrawAt ?? 0;
  const withdrawCooldownRemaining = getWithdrawCooldownRemaining(lastWithdrawAt, now);

  const depositBlockReason = useMemo((): TreasuryBlockReason | null => {
    if (!walletMode) return "demo-mode";
    if (!connected || !publicKey) return "wallet-not-connected";
    if (!treasuryPubkey) return "treasury-not-configured";
    if (!mintPubkey) return "mint-not-configured";
    if (!depositAmountValid) return "invalid-deposit-amount";
    return null;
  }, [
    connected,
    depositAmountValid,
    mintPubkey,
    publicKey,
    treasuryPubkey,
    walletMode,
  ]);

  const withdrawBlockReason = useMemo(() => {
    if (!walletMode) return "demo-mode" as TreasuryBlockReason;
    if (!connected || !publicKey) return "wallet-not-connected" as TreasuryBlockReason;
    if (!treasuryPubkey) return "treasury-not-configured" as TreasuryBlockReason;
    if (!mintPubkey) return "mint-not-configured" as TreasuryBlockReason;

    return getWithdrawBlockReason(
      playerLevel,
      corn,
      lastWithdrawAt,
      now,
      parsedWithdrawAmount,
    );
  }, [
    connected,
    corn,
    lastWithdrawAt,
    mintPubkey,
    now,
    parsedWithdrawAmount,
    playerLevel,
    publicKey,
    treasuryPubkey,
    walletMode,
  ]);

  const canDeposit =
    hydrated && depositBlockReason === null && status.type !== "loading";

  const canWithdraw =
    hydrated && withdrawBlockReason === null && status.type !== "loading";

  const deposit = useCallback(async () => {
    if (!publicKey || !treasuryPubkey || !mintPubkey) {
      setStatus({
        type: "error",
        message: getTreasuryBlockMessage("wallet-not-connected"),
      });
      return;
    }

    if (depositBlockReason) {
      setStatus({
        type: "error",
        message: getTreasuryBlockMessage(depositBlockReason),
      });
      return;
    }

    const amount = parsedDepositAmount;

    setStatus({
      type: "loading",
      message: `Sending ${formatCornAmount(amount)} to treasury…`,
    });

    try {
      const transaction = await buildCornDepositTransaction(
        connection,
        publicKey,
        treasuryPubkey,
        amount,
      );
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

      const verified = await verifyCornDepositTransaction(
        connection,
        signature,
        publicKey,
        treasuryPubkey,
        amount,
      );

      if (!verified) {
        setStatus({
          type: "error",
          message: "Deposit transaction could not be verified.",
        });
        return;
      }

      markDepositProcessed(publicKey.toBase58(), signature);
      creditTreasuryCorn(amount);

      setWalletTreasuryState(loadWalletTreasuryState(publicKey.toBase58()));
      setStatus({
        type: "success",
        message: `Deposited ${formatCornAmount(amount)}. In-game balance updated.`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Deposit failed. Try again.";
      setStatus({ type: "error", message });
    }
  }, [
    connection,
    creditTreasuryCorn,
    depositBlockReason,
    mintPubkey,
    parsedDepositAmount,
    publicKey,
    sendTransaction,
    treasuryPubkey,
  ]);

  const withdraw = useCallback(async () => {
    if (!publicKey || !treasuryPubkey || !mintPubkey) {
      setStatus({
        type: "error",
        message: getTreasuryBlockMessage("wallet-not-connected"),
      });
      return;
    }

    if (withdrawBlockReason) {
      setStatus({
        type: "error",
        message: getTreasuryBlockMessage(withdrawBlockReason),
      });
      return;
    }

    const amount = parsedWithdrawAmount;

    if (!debitTreasuryCorn(amount)) {
      setStatus({
        type: "error",
        message: getTreasuryBlockMessage("insufficient-corn"),
      });
      return;
    }

    setStatus({
      type: "loading",
      message: `Withdrawing ${formatCornAmount(amount)}…`,
    });

    try {
      const response = await fetch("/api/treasury/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: publicKey.toBase58(), corn: amount }),
      });

      const payload = (await response.json()) as {
        error?: string;
        signature?: string;
        remainingMs?: number;
        corn?: number;
      };

      if (!response.ok) {
        creditTreasuryCorn(amount);

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

      setLastWithdrawAt(publicKey.toBase58(), Date.now());
      setWalletTreasuryState(loadWalletTreasuryState(publicKey.toBase58()));

      setStatus({
        type: "success",
        message: `Withdrew ${formatCornAmount(amount)} SPL to your wallet.`,
      });
    } catch (error) {
      creditTreasuryCorn(amount);
      const message =
        error instanceof Error ? error.message : "Withdrawal failed. Your $CORN was restored.";
      setStatus({ type: "error", message });
    }
  }, [
    creditTreasuryCorn,
    debitTreasuryCorn,
    mintPubkey,
    parsedWithdrawAmount,
    publicKey,
    treasuryPubkey,
    withdrawBlockReason,
  ]);

  const clearStatus = useCallback(() => {
    setStatus({ type: "idle", message: "" });
  }, []);

  const withdrawHint = useMemo(() => {
    if (!walletMode) return "Available in wallet mode only.";
    if (!connected) return "Connect your wallet first.";
    if (!treasuryPubkey) return "Treasury wallet is not configured.";
    if (!mintPubkey) return "$CORN mint is not configured.";
    if (playerLevel < WITHDRAW_MIN_LEVEL) {
      return `Unlocks at level ${WITHDRAW_MIN_LEVEL} — protects treasury while it is seeded at launch and refilled by deposits. You are level ${playerLevel}.`;
    }
    if (corn < parsedWithdrawAmount) {
      return `Need ${parsedWithdrawAmount.toLocaleString("en-US")} in-game $CORN.`;
    }
    if (withdrawCooldownRemaining > 0) {
      return `Cooldown: ${formatCooldown(withdrawCooldownRemaining)} remaining.`;
    }
    return "Sends SPL $CORN from treasury to your wallet (1:1 in-game debit).";
  }, [
    connected,
    corn,
    mintPubkey,
    parsedWithdrawAmount,
    playerLevel,
    treasuryPubkey,
    walletMode,
    withdrawCooldownRemaining,
  ]);

  const depositHint = useMemo(() => {
    if (!walletMode) return "Available in wallet mode only.";
    if (!connected) return "Connect your wallet first.";
    if (!treasuryPubkey) return "Treasury wallet is not configured.";
    if (!mintPubkey) return "$CORN mint is not configured.";
    return `Send SPL $CORN to the treasury wallet — credited 1:1 in-game (min ${MIN_DEPOSIT_CORN}).`;
  }, [connected, mintPubkey, treasuryPubkey, walletMode]);

  return {
    canDeposit,
    canWithdraw,
    deposit,
    withdraw,
    status,
    clearStatus,
    depositAmount,
    setDepositAmount,
    withdrawAmount,
    setWithdrawAmount,
    depositAmountValid,
    withdrawAmountValid,
    depositBlockReason,
    withdrawBlockReason,
    withdrawCooldownRemaining,
    withdrawHint,
    depositHint,
    depositRateLabel: "1:1 SPL $CORN → in-game balance",
    withdrawRateLabel: "1:1 in-game $CORN → SPL wallet",
    withdrawMinLevel: WITHDRAW_MIN_LEVEL,
    playerLevel,
    isLoading: status.type === "loading",
    minDepositCorn: MIN_DEPOSIT_CORN,
    minWithdrawCorn: MIN_WITHDRAW_CORN,
  };
}
