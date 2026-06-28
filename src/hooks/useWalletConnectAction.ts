"use client";

import { useCallback, useMemo } from "react";
import { useWalletMultiButton } from "@solana/wallet-adapter-base-ui";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { usePlayMode } from "@/context/PlayModeProvider";
import { formatWalletAddress } from "@/lib/walletDisplay";

// Shared wallet connect flow for header, demo banner, and mode gate.
export function useWalletConnectAction() {
  const { setVisible } = useWalletModal();
  const { selectPlayMode, playMode, walletModeEnabled } = usePlayMode();
  const {
    buttonState,
    onConnect,
    onDisconnect,
    publicKey,
    walletIcon,
    walletName,
  } = useWalletMultiButton({
    onSelectWallet() {
      setVisible(true);
    },
  });

  const connected = buttonState === "connected";
  const connecting = buttonState === "connecting";

  const addressLabel = useMemo(
    () => (publicKey ? formatWalletAddress(publicKey) : ""),
    [publicKey],
  );

  const connectWallet = useCallback(() => {
    if (connected) return;
    if (!walletModeEnabled) return;

    if (playMode !== "wallet") {
      selectPlayMode("wallet");
    }

    if (buttonState === "has-wallet" || connecting) {
      onConnect?.();
      return;
    }

    setVisible(true);
  }, [
    buttonState,
    connected,
    connecting,
    onConnect,
    playMode,
    selectPlayMode,
    setVisible,
    walletModeEnabled,
  ]);

  const disconnectWallet = useCallback(() => {
    onDisconnect?.();
  }, [onDisconnect]);

  const changeWallet = useCallback(() => {
    setVisible(true);
  }, [setVisible]);

  return {
    connectWallet,
    disconnectWallet,
    changeWallet,
    walletModeEnabled,
    buttonState,
    connected,
    connecting,
    publicKey,
    addressLabel,
    walletIcon,
    walletName,
  };
}
