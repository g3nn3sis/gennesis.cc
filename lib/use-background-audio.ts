"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useBackgroundAudio(tracks: readonly string[]) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.src) audio.src = tracks[Math.floor(Math.random() * tracks.length)];
    audio.play().catch((err) => console.warn("Playback failed:", err));
  }, [tracks]);

  const toggleMuted = useCallback(() => setMuted((m) => !m), []);

  const setVolume = useCallback((volume: number) => {
    if (audioRef.current) audioRef.current.volume = volume;
    setMuted(volume === 0);
  }, []);

  return { audioRef, muted, play, toggleMuted, setVolume };
}
