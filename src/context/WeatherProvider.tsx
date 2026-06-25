"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getMsUntilNextWeather,
  getWeatherAt,
  type WeatherType,
} from "@/lib/weatherConfig";

type WeatherContextValue = {
  weather: WeatherType;
  msUntilChange: number;
};

const WeatherContext = createContext<WeatherContextValue | null>(null);

export function WeatherProvider({ children }: { children: ReactNode }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const value = useMemo<WeatherContextValue>(
    () => ({
      weather: getWeatherAt(now),
      msUntilChange: getMsUntilNextWeather(now),
    }),
    [now],
  );

  return (
    <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>
  );
}

export function useWeather(): WeatherContextValue {
  const context = useContext(WeatherContext);
  if (!context) {
    throw new Error("useWeather must be used within WeatherProvider");
  }
  return context;
}
