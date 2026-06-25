"use client";

import { useBackgroundMusic } from "@/context/BackgroundMusicProvider";

export function MusicControl() {
  const { hydrated, muted, volume, setVolume, toggleMute } = useBackgroundMusic();

  if (!hydrated) return null;

  const volumePercent = Math.round(volume * 100);

  return (
    <div className="hud-action-button min-w-0 w-[5.25rem] shrink-0 sm:w-[6.5rem]">
      <button
        type="button"
        onClick={toggleMute}
        className="hud-action-button__icon hud-action-button__icon-btn"
        aria-label={muted ? "Unmute music" : "Mute music"}
        title={muted ? "Unmute music" : "Mute music"}
      >
        {muted || volumePercent === 0 ? "🔇" : "🔊"}
      </button>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={muted ? 0 : volumePercent}
        onChange={(event) => setVolume(Number(event.target.value) / 100)}
        className="music-volume-slider h-1 min-w-0 flex-1 cursor-pointer accent-[#8b6914]"
        aria-label="Music volume"
        title={`Music volume: ${volumePercent}%`}
      />
    </div>
  );
}
