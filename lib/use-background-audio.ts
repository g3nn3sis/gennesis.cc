"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Track } from "@/lib/site";

const SETTINGS_KEY = "gennesis-audio-settings";
const SETTINGS_CHANGE_EVENT = "gennesis-audio-settings-change";
const DEFAULT_VOLUME = 0.35;
const DEFAULT_SETTINGS = { muted: false, volume: DEFAULT_VOLUME } as const;

interface AudioSettings {
  muted: boolean;
  volume: number;
}

function isAudioSettings(value: unknown): value is AudioSettings {
  if (!value || typeof value !== "object") return false;
  const settings = value as Record<string, unknown>;
  return (
    typeof settings.muted === "boolean" &&
    typeof settings.volume === "number" &&
    Number.isFinite(settings.volume) &&
    settings.volume >= 0 &&
    settings.volume <= 1
  );
}

let fallbackSettings: AudioSettings = { ...DEFAULT_SETTINGS };
let cachedStoredSettings: string | null | undefined;
let cachedSettings: AudioSettings = fallbackSettings;

function getSettings(): AudioSettings {
  try {
    const storedSettings = localStorage.getItem(SETTINGS_KEY);
    if (storedSettings === cachedStoredSettings) return cachedSettings;

    cachedStoredSettings = storedSettings;
    if (storedSettings) {
      const settings = JSON.parse(storedSettings);
      if (isAudioSettings(settings)) {
        fallbackSettings = settings;
        cachedSettings = settings;
        return cachedSettings;
      }
    }
  } catch {
    // Fall back to this tab's settings when browser storage is unavailable.
  }
  cachedSettings = fallbackSettings;
  return cachedSettings;
}

function subscribeToSettings(onStoreChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === SETTINGS_KEY) onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(SETTINGS_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(SETTINGS_CHANGE_EVENT, onStoreChange);
  };
}

function saveSettings(settings: AudioSettings) {
  fallbackSettings = settings;
  cachedSettings = settings;
  try {
    const serializedSettings = JSON.stringify(settings);
    localStorage.setItem(SETTINGS_KEY, serializedSettings);
    cachedStoredSettings = serializedSettings;
  } catch {
    // Keep the in-memory setting when browser storage is unavailable.
  }
  window.dispatchEvent(new Event(SETTINGS_CHANGE_EVENT));
}

function shuffledIndices(length: number): number[] {
  const order = Array.from({ length }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export function useBackgroundAudio(tracks: readonly Track[]) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const startedRef = useRef(false);
  const [order] = useState(() => shuffledIndices(tracks.length));
  const [position, setPosition] = useState(0);
  const { muted, volume } = useSyncExternalStore(
    subscribeToSettings,
    getSettings,
    () => DEFAULT_SETTINGS,
  );

  const trackCount = tracks.length;
  const currentTrack = tracks[order[position] ?? 0];

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.muted = muted;
      audio.volume = volume;
    }
  }, [muted, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    audio.src = currentTrack.src;
    if (startedRef.current) {
      audio.play().catch((err) => console.warn("Playback failed:", err));
    }
  }, [currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const advance = () => setPosition((current) => (current + 1) % trackCount);
    audio.addEventListener("ended", advance);
    return () => audio.removeEventListener("ended", advance);
  }, [trackCount]);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    startedRef.current = true;
    if (!audio.src) audio.src = currentTrack.src;
    audio.muted = muted;
    audio.volume = volume;
    audio.play().catch((err) => console.warn("Playback failed:", err));
  }, [currentTrack, muted, volume]);

  const toggleMuted = useCallback(() => {
    saveSettings({
      muted: !muted,
      volume: muted && volume === 0 ? DEFAULT_VOLUME : volume,
    });
  }, [muted, volume]);

  const setVolume = useCallback((volume: number) => {
    const nextVolume = Math.max(0, Math.min(1, volume));
    saveSettings({ muted: nextVolume === 0, volume: nextVolume });
  }, []);

  return {
    audioRef,
    muted,
    play,
    toggleMuted,
    setVolume,
    volume,
    currentTrack,
    trackNumber: position + 1,
    trackCount,
  };
}
