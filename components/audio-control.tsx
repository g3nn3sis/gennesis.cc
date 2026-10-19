"use client";

import { useEffect, useRef } from "react";
import { VolumeOffIcon, VolumeOnIcon } from "./icons";

interface AudioControlProps {
  muted: boolean;
  onToggle: () => void;
  onVolumeChange: (volume: number) => void;
}

export default function AudioControl({ muted, onToggle, onVolumeChange }: AudioControlProps) {
  const sliderRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;
    const release = () => slider.blur();
    slider.addEventListener("change", release);
    return () => slider.removeEventListener("change", release);
  }, []);

  const release = () => sliderRef.current?.blur();

  return (
    <div className="audio-control">
      <div className="audio-slider-wrap">
        <div className="audio-slider-inner">
          <input
            ref={sliderRef}
            type="range"
            className="audio-slider"
            min={0}
            max={100}
            defaultValue={100}
            aria-label="Volume"
            onInput={(e) => onVolumeChange(Number(e.currentTarget.value) / 100)}
            onMouseUp={release}
            onTouchEnd={release}
          />
        </div>
      </div>
      <button
        type="button"
        className="audio-toggle"
        aria-label={muted ? "Unmute audio" : "Mute audio"}
        title={muted ? "Unmute" : "Mute"}
        onClick={onToggle}
      >
        {muted ? <VolumeOffIcon /> : <VolumeOnIcon />}
      </button>
    </div>
  );
}
