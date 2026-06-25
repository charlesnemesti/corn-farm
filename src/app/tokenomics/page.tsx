import Link from "next/link";
import {
  getClusterLabel,
  getCornMintAddress,
  getTreasuryPublicKey,
  TOKENOMICS,
  WITHDRAW_MIN_LEVEL,
} from "@/lib/treasuryConfig";

export const metadata = {
  title: "Tokenomics — SolFarm",
  description: "$CORN pump.fun launch, treasury funding, and in-game economy",
};

export default function TokenomicsPage() {
  const treasury = getTreasuryPublicKey();
  const mint = getCornMintAddress();

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-10 text-white">
      <Link
        href="/"
        className="text-sm font-medium text-farm-sun transition hover:text-farm-sun-dark"
      >
        ← Back to farm
      </Link>

      <h1 className="mt-6 text-3xl font-bold text-farm-sun">$CORN Tokenomics</h1>
      <p className="mt-2 text-sm text-white/70">
        Fair-launch memecoin on {TOKENOMICS.launchPlatform} powering SolFarm on{" "}
        {getClusterLabel()}.
      </p>

      <section className="mt-8 rounded-xl border border-white/15 bg-black/60 p-5">
        <h2 className="text-lg font-semibold text-white">pump.fun launch</h2>
        <p className="mt-2 text-sm text-white/75">{TOKENOMICS.launchSummary}</p>
        <p className="mt-3 text-sm text-white/75">
          Total supply:{" "}
          <span className="font-semibold text-farm-sun">
            {TOKENOMICS.totalSupply.toLocaleString("en-US")} {TOKENOMICS.symbol}
          </span>
        </p>
        <p className="mt-3 text-xs text-white/55">{TOKENOMICS.graduation}</p>
      </section>

      <section className="mt-6 rounded-xl border border-farm-sun/25 bg-farm-sun/10 p-5">
        <h2 className="text-lg font-semibold text-farm-sun">Treasury wallet</h2>
        <p className="mt-2 text-sm text-white/75">{TOKENOMICS.treasury.backsWithdrawals}</p>
        <ul className="mt-4 space-y-3 text-sm">
          <li className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
            <p className="font-medium text-white">Manual seed at launch</p>
            <p className="mt-1 text-xs text-white/60">{TOKENOMICS.treasury.manualSeed}</p>
          </li>
          <li className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
            <p className="font-medium text-white">Organic refills</p>
            <p className="mt-1 text-xs text-white/60">{TOKENOMICS.treasury.organicGrowth}</p>
          </li>
          <li className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
            <p className="font-medium text-white">
              Withdraw lock — level {WITHDRAW_MIN_LEVEL}
            </p>
            <p className="mt-1 text-xs text-white/60">
              {TOKENOMICS.treasury.withdrawGateReason}
            </p>
          </li>
        </ul>
      </section>

      <section className="mt-6 rounded-xl border border-white/15 bg-black/60 p-5">
        <h2 className="text-lg font-semibold text-white">Player flow</h2>
        <ol className="mt-4 space-y-2">
          {TOKENOMICS.playerFlow.map((step, index) => (
            <li
              key={step.label}
              className="flex gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
            >
              <span className="shrink-0 font-bold text-farm-grass">{index + 1}.</span>
              <div>
                <p className="font-medium text-white">{step.label}</p>
                <p className="text-xs text-white/60">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-6 rounded-xl border border-white/15 bg-black/60 p-5">
        <h2 className="text-lg font-semibold text-white">In-game sinks</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-white/75">
          {TOKENOMICS.sinks.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-xl border border-white/15 bg-black/60 p-5">
        <h2 className="text-lg font-semibold text-white">On-chain addresses</h2>
        <dl className="mt-3 space-y-3 text-sm">
          <div>
            <dt className="text-white/60">Treasury wallet</dt>
            <dd className="mt-1 break-all font-mono text-xs text-farm-sun">
              {treasury?.toBase58() ?? "Configure NEXT_PUBLIC_TREASURY_PUBKEY"}
            </dd>
          </div>
          <div>
            <dt className="text-white/60">$CORN mint (pump.fun)</dt>
            <dd className="mt-1 break-all font-mono text-xs text-farm-sun">
              {mint ?? "Configure NEXT_PUBLIC_CORN_MINT"}
            </dd>
          </div>
        </dl>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-xs text-white/55">
          {TOKENOMICS.risks.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
