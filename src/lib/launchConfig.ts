// NOTE: All code must stay in English, even when requirements arrive in Spanish.

/** Production treasury — same wallet as test; only the mint CA changes at launch. */
export const LAUNCH_TREASURY_PUBKEY =
  "AXp2F7NP3cKU7nP8HXXL1XKuSrj1JeAYj2im4JKvNyvj";

/** User-facing copy while the official $CORN mint is not wired yet. */
export const LAUNCH_COPY = {
  walletBannerTitle: "$CORN on-chain opens right after launch",
  walletBannerBody:
    "We are funding the treasury wallet and connecting the official $CORN token. Deposits and withdrawals will go live in about 5–10 minutes once everything is wired up. You can still farm, rank on the leaderboard, and save progress in wallet mode.",
  treasuryPanelLead:
    "Treasury deposits and withdrawals are paused until the official $CORN token is connected. This usually takes 5–10 minutes after launch while we fund the treasury wallet.",
  loginWalletSubtitle:
    "Server save and weekly leaderboard are live now. On-chain $CORN deposits open minutes after we connect the official token at launch.",
  loginWalletCardDescription: "Server save · Leaderboard · Treasury at launch",
} as const;
