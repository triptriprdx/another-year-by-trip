import type { Background, EraId, ProfessionId } from "./config";

export type StatKey = "health" | "mood" | "energy" | "intelligence" | "reputation";
export type Stats = Record<StatKey, number>;

export type NpcRole = "mother" | "father" | "sibling" | "friend" | "partner" | "child";
export interface Npc {
  id: string;
  name: string;
  role: NpcRole;
  age: number;
  trait: string;
  relation: number;
  alive: boolean;
}
export interface Appearance { skin: number; hair: number; shirt: number; }
export interface Character {
  firstName: string; lastName: string; pronouns: string; country: string;
  background: Background; appearance: Appearance;
}
export interface Career {
  profession: ProfessionId; skill: number; level: number; sessionsThisYear: number;
  bestScores: Record<string, number>; milestones: string[];
}
export interface HistoryEntry { year: number; age: number; text: string; tone?: "good" | "bad" | "neutral"; }
export interface PendingEvent { id: string; title: string; text: string; choices: string[]; }
export interface Outcome { text: string; deltas: { label: string; value: number }[]; }
export interface GameState {
  version: 1; seed: number; era: EraId; char: Character; age: number; year: number;
  stats: Stats; money: number; npcs: Npc[]; career: Career;
  education: "in school" | "graduated" | "dropped out";
  history: HistoryEntry[]; achievements: string[]; pending: PendingEvent | null;
  lastOutcome: Outcome | null; alive: boolean; deathAge?: number;
  restedThisYear?: boolean; workSessionsThisYear?: number; homeLevel?: number; transportLevel?: number;
}