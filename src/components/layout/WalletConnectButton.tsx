"use client";

import { useEffect, useRef, useState } from "react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { useWalletConnectAction } from "@/hooks/useWalletConnectAction";

const DEFAULT_WALLET_ICON = new PhantomWalletAdapter().icon;

// Header wallet control — Connect, connected wallet summary, or disconnect.
export function WalletConnectButton() {
  const {
    connectWallet,
    disconnectWallet,
    changeWallet,
    walletModeEnabled,
    connected,
    addressLabel,
    walletIcon,
    walletName,
    connecting,
    publicKey,
  } = useWalletConnectAction();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const icon = walletIcon ?? DEFAULT_WALLET_ICON;
  const name = walletName ?? "Wallet";

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [menuOpen]);

  if (!walletModeEnabled && !connected) {
    return null;
  }

  if (connected && publicKey) {
    return (
      <div className="relative min-w-0 flex-1" ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        className="hud-action-button hud-action-button--connected min-w-0 max-w-[8.75rem] flex-1 !justify-start sm:max-w-[10rem]"
        title={`${name} — ${publicKey.toBase58()}`}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
      >
        <span className="hud-action-button__icon shrink-0" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={icon} alt="" draggable={false} />
        </span>
        <span className="min-w-0 truncate text-left">
          {name} · {addressLabel}
        </span>
      </button>

        {menuOpen ? (
          <div
            className="absolute top-full left-0 z-[200] mt-1 min-w-[10.5rem] overflow-hidden rounded-md border border-[#4a3428]/20 bg-[#f5e6c8] py-1 shadow-lg"
            role="menu"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                changeWallet();
                setMenuOpen(false);
              }}
              className="w-full px-3 py-1.5 text-left text-xs font-semibold text-[#4a3428] transition hover:bg-[#4a3428]/10"
            >
              Change wallet
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                disconnectWallet();
                setMenuOpen(false);
              }}
              className="w-full px-3 py-1.5 text-left text-xs font-semibold text-[#8b2e2e] transition hover:bg-[#4a3428]/10"
            >
              Disconnect wallet
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={connectWallet}
      disabled={connecting}
      className="hud-action-button"
      title={connecting ? "Connecting wallet…" : `Connect with ${name}`}
      aria-label={connecting ? "Connecting wallet" : "Connect wallet"}
    >
      <span className="hud-action-button__icon" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={icon} alt="" draggable={false} />
      </span>
      {connecting ? "Connecting…" : "Connect"}
    </button>
  );
}
