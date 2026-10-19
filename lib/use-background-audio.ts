"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

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

export function useBackgroundAudio(tracks: readonly string[]) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { muted, volume } = useSyncExternalStore(
    subscribeToSettings,
    getSettings,
    () => DEFAULT_SETTINGS,
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.muted = muted;
      audio.volume = volume;
    }
  }, [muted, volume]);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.src) audio.src = tracks[Math.floor(Math.random() * tracks.length)];
    audio.muted = muted;
    audio.volume = volume;
    audio.play().catch((err) => console.warn("Playback failed:", err));
  }, [muted, tracks, volume]);

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

  return { audioRef, muted, play, toggleMuted, setVolume, volume };
}
