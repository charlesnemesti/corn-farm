export type WeatherType = "sunny" | "rain" | "snow" | "wind";

/** Weather changes every 3 minutes, synced to wall clock. */
export const WEATHER_CYCLE_MS = 3 * 60 * 1000;

/** Cycle order follows the wheel clockwise from sunny (top-right). */
export const WEATHER_CYCLE: readonly WeatherType[] = [
  "sunny",
  "snow",
  "wind",
  "rain",
] as const;

/** Needle rotation (0° = up) toward each quadrant center on the wheel art. */
export const WEATHER_NEEDLE_DEG: Record<WeatherType, number> = {
  rain: 315,
  sunny: 45,
  snow: 135,
  wind: 225,
};

export const WEATHER_WHEEL = {
  src: "/assets/ui/weather-wheel.png?v=4",
  displaySize: 228,
} as const;

export function getWeatherIndexAt(timeMs: number): number {
  return Math.floor(timeMs / WEATHER_CYCLE_MS) % WEATHER_CYCLE.length;
}

export function getWeatherAt(timeMs: number): WeatherType {
  return WEATHER_CYCLE[getWeatherIndexAt(timeMs)] ?? "sunny";
}

export function getMsUntilNextWeather(timeMs: number): number {
  const elapsed = timeMs % WEATHER_CYCLE_MS;
  return WEATHER_CYCLE_MS - elapsed;
}
