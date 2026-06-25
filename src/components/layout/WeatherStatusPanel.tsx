"use client";

import { useWeather } from "@/context/WeatherProvider";
import {
  WEATHER_DISPLAY_NAMES,
  getWeatherBonusSummary,
} from "@/lib/weatherEffects";
import { formatWeatherCountdown } from "@/lib/weatherConfig";

// Current weather, active bonuses, and countdown below the weather wheel.
export function WeatherStatusPanel() {
  const { weather, msUntilChange, isSpinning, hydrated } = useWeather();

  if (!hydrated) {
    return (
      <div
        className="pointer-events-none w-[min(calc(100vw-1.5rem),15rem)] rounded-lg border border-[#4a3428]/25 bg-[#f5e6c8]/95 px-3 py-2 opacity-0 shadow-md"
        aria-hidden
      />
    );
  }

  const countdownLabel = isSpinning
    ? "Rolling…"
    : `Next change in ${formatWeatherCountdown(msUntilChange)}`;

  return (
    <div
      className="pointer-events-none w-[min(calc(100vw-1.5rem),15rem)] rounded-lg border border-[#4a3428]/25 bg-[#f5e6c8]/95 px-3 py-2 text-center text-[#4a3428] shadow-md"
      aria-live="polite"
    >
      <p className="text-[11px] font-bold leading-snug sm:text-xs">
        {WEATHER_DISPLAY_NAMES[weather]}
      </p>
      <p className="mt-0.5 text-[10px] leading-snug text-[#4a3428]/90 sm:text-[11px]">
        {getWeatherBonusSummary(weather)}
      </p>
      <p
        className="mt-1.5 border-t border-[#4a3428]/15 pt-1.5 text-[10px] font-bold tabular-nums leading-none text-[#4a3428]/85 sm:text-[11px]"
        title={
          isSpinning
            ? "Weather roulette spinning"
            : "Time until the next weather change"
        }
      >
        {countdownLabel}
      </p>
    </div>
  );
}
