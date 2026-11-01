import { useSyncExternalStore } from "react";
import { SAVE_KEY, SETTINGS_KEY } from "./config";
import type { GameState } from "./types";

export interface Settings { sound: boolean; }

let game: GameState | null = null;
let settings: Settings = { sound: true };
let loaded = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Call once from useEffect on the client. */
export function loadSave() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) { const g = JSON.parse(raw); if (g?.version === 1) game = g; }
    const st = localStorage.getItem(SETTINGS_KEY);
    if (st) settings = { ...settings, ...JSON.parse(st) };
  } catch { /* corrupted save ignored */ }
  emit();
}

export function setGame(g: GameState | null) {
  game = g;
  try {
    if (g) localStorage.setItem(SAVE_KEY, JSON.stringify(g));
    else localStorage.removeItem(SAVE_KEY);
  } catch { /* storage full */ }
  emit();
}
export function setSettings(s: Settings) {
  settings = s;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  emit();
}

const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
export const useGame = () => useSyncExternalStore(subscribe, () => game, () => null);
export const useSettings = () => useSyncExternalStore(subscribe, () => settings, () => settings);
export const useLoaded = () => useSyncExternalStore(subscribe, () => loaded, () => false);