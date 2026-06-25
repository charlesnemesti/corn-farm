"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { formatCornPerHour } from "@/lib/cropState";

type LeaderboardPanelProps = {
  open: boolean;
  onClose: () => void;
};

export function LeaderboardPanel({ open, onClose }: LeaderboardPanelProps) {
  const { data, loading, weekCountdown, prizeTiers, playerWallet, shortenWallet } =
    useLeaderboard();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  const playerRank =
    playerWallet && data
      ? data.entries.find((entry) => entry.wallet === playerWallet)?.rank ?? null
      : null;

  return createPortal(
    <div className="pointer-events-auto fixed inset-0 z-[210] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]">
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-xl border border-white/15 bg-black/95 text-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="leaderboard-panel-title"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 p-5">
          <div>
            <h2 id="leaderboard-panel-title" className="text-base font-bold text-farm-sun">
              Weekly leaderboard
            </h2>
            <p className="mt-1 text-xs text-white/65">
              Ranked by $CORN/h production · Resets in {weekCountdown}
            </p>
            {playerRank ? (
              <p className="mt-1 text-xs font-semibold text-farm-grass">
                Your rank: #{playerRank}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/15 px-2 py-1 text-xs text-white/70 transition hover:bg-white/10"
            aria-label="Close leaderboard"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          <section className="mb-4 rounded-lg border border-farm-sun/20 bg-farm-sun/10 p-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-farm-sun">
              Weekly prizes
            </h3>
            <ul className="mt-2 space-y-1 text-xs text-white/75">
              {prizeTiers.map((tier) => (
                <li key={tier.prizeLabel}>
                  {tier.prizeLabel}: {tier.prizeCorn.toLocaleString("en-US")} $CORN
                </li>
              ))}
            </ul>
          </section>

          {loading && !data ? (
            <p className="text-center text-sm text-white/60">Loading rankings…</p>
          ) : null}

          {data && data.entries.length === 0 ? (
            <p className="text-center text-sm text-white/60">
              No entries yet. Plant crops in wallet mode to compete.
            </p>
          ) : null}

          {data && data.entries.length > 0 ? (
            <ol className="space-y-2">
              {data.entries.slice(0, 20).map((entry) => (
                <li
                  key={entry.wallet}
                  className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm ${
                    entry.wallet === playerWallet
                      ? "border-farm-grass/40 bg-farm-grass/10"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-white">
                      #{entry.rank}{" "}
                      {entry.isFounder ? (
                        <span className="text-farm-sun" title="Founder farmer">
                          ★
                        </span>
                      ) : null}{" "}
                      {shortenWallet(entry.wallet)}
                    </p>
                    <p className="text-xs text-white/55">
                      Lv {entry.playerLevel} · {entry.unlockedRows} rows
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-farm-grass">
                    {formatCornPerHour(entry.cornPerHour)}
                  </span>
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
