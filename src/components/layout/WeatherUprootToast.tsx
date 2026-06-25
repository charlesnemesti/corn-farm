"use client";

import { usePathname } from "next/navigation";
import { useGame } from "@/context/GameProvider";
import { isDocsRoute } from "@/lib/routes";

// Brief toast when wind uproots a crop and returns the seed.
export function WeatherUprootToast() {
  const pathname = usePathname();
  const { windUprootNotice } = useGame();

  if (isDocsRoute(pathname) || !windUprootNotice) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-24 z-[55] flex justify-center px-4">
      <p className="rounded-lg border border-[#4a3428]/25 bg-[#f5e6c8]/95 px-4 py-2 text-center text-sm font-semibold text-[#4a3428] shadow-lg">
        {windUprootNotice}
      </p>
    </div>
  );
}
