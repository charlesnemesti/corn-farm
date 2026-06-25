"use client";

import { useWeather } from "@/context/WeatherProvider";
import { WEATHER_NEEDLE_DEG, WEATHER_WHEEL } from "@/lib/weatherConfig";

// Static weather wheel art with a center needle that rotates to the active quadrant.
export function WeatherWheel() {
  const { weather } = useWeather();
  const needleDeg = WEATHER_NEEDLE_DEG[weather];
  const size = WEATHER_WHEEL.displaySize;

  return (
    <div
      className="pointer-events-none relative shrink-0"
      style={{ width: size, height: size }}
      aria-label={`Weather: ${weather}`}
      title={`Weather: ${weather}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={WEATHER_WHEEL.src}
        alt=""
        draggable={false}
        className="h-full w-full object-contain pixel-art drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
        aria-hidden
      />

      <div
        className="absolute inset-0 transition-transform duration-700 ease-out"
        style={{
          transform: `rotate(${needleDeg}deg)`,
          transformOrigin: "50% 50%",
        }}
        aria-hidden
      >
        <div
          className="absolute left-1/2 top-1/2 flex flex-col items-center"
          style={{ height: "18%", transform: "translate(-50%, -100%)" }}
        >
          <div className="h-0 w-0 shrink-0 border-x-[8px] border-x-transparent border-b-[9px] border-b-[#dc2626]" />
          <div className="w-[5%] min-h-0 flex-1 rounded-[1px] bg-[#dc2626] shadow-[0_0_0_0.5px_#7f1d1d]" />
        </div>
      </div>
    </div>
  );
}
