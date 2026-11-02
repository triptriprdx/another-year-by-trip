import {
  BACKGROUNDS, ERAS, FIRST_NAMES, LAST_NAMES, LEVEL_THRESHOLDS, TRAITS, getProfession,
  type Background, type ProfessionId,
} from "./config";
import type { Character, GameState, Npc, NpcRole, Outcome, StatKey } from "./types";
import { EVENTS } from "./events";

export const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));

/** Seeded RNG (mulberry32). Advances s.seed so randomness is reproducible from a save. */
export function rand(s: GameState): number {
  let t = (s.seed = (s.seed + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
export const randInt = (s: GameState, lo: number, hi: number) => lo + Math.floor(rand(s) * (hi - lo + 1));
export const pick = <T,>(s: GameState, arr: T[]): T => arr[Math.floor(rand(s) * arr.length)];

/** Outcome builder used by event choices. Tracks visible deltas. */
export class Fx {
  deltas: { label: string; value: number }[] = [];
  constructor(public s: GameState) {}
  stat(k: StatKey, v: number) {
    const before = this.s.stats[k];
    this.s.stats[k] = clamp(before + v);
    const d = this.s.stats[k] - before;
    if (d) this.deltas.push({ label: k[0].toUpperCase() + k.slice(1), value: d });
    return this;
  }
  money(v: number) {
    const before = this.s.money;
    this.s.money = Math.max(0, Math.round(before + v));
    const d = this.s.money - before;
    if (d) this.deltas.push({ label: "Money", value: d });
    return this;
  }
  skill(v: number) {
    const c = this.s.career;
    const before = c.skill;
    c.skill = clamp(before + v);
    const d = c.skill - before;
    if (d) this.deltas.push({ label: getProfession(c.profession).skillName, value: d });
    return this;
  }
  rel(role: NpcRole | "family", v: number) {
    const targets = this.s.npcs.filter((n) => n.alive && (role === "family" ? ["mother", "father", "sibling"].includes(n.role) : n.role === role));
    targets.forEach((n) => (n.relation = clamp(n.relation + v)));
    if (targets.length && v) this.deltas.push({ label: role === "family" ? "Family bond" : `${role[0].toUpperCase() + role.slice(1)} bond`, value: v });
    return this;
  }
  outcome(text: string): Outcome {
    return { text, deltas: this.deltas };
  }
}

const uid = (s: GameState) => Math.floor(rand(s) * 1e9).toString(36);

export function makeNpc(s: GameState, role: NpcRole, age: number, lastName?: string): Npc {
  const pool = FIRST_NAMES[s.era];
  const last = lastName ?? pick(s, LAST_NAMES[s.era]);
  return { id: uid(s), name: `${pick(s, pool)} ${last}`, role, age, trait: pick(s, TRAITS), relation: randInt(s, 55, 85), alive: true };
}

export interface NewLifeInput {
  profession: ProfessionId;
  char: Character;
  age: number;
}

export function createLife({ profession, char, age }: NewLifeInput, seed = Date.now()): GameState {
  const prof = getProfession(profession);
  const era = ERAS[prof.era];
  const bg = BACKGROUNDS.find((b) => b.id === char.background)!;
  const s: GameState = {
    version: 1,
    seed: seed | 0,
    era: prof.era,
    char: { ...char, country: prof.fixedCountry ?? char.country },
    age,
    year: 0,
    stats: { health: 80, mood: 70, energy: 80, intelligence: 50, reputation: 10 },
    money: bg.money,
    npcs: [],
    career: { profession, skill: 5, level: 0, sessionsThisYear: 0, bestScores: {}, milestones: [] },
    education: "in school",
    history: [],
    achievements: [],
    pending: null,
    lastOutcome: null,
    alive: true,
    restedThisYear: false,
    workSessionsThisYear: 0,
  };
  s.year = randInt(s, era.yearRange[0], era.yearRange[1]);
  s.stats.intelligence = randInt(s, 35, 70);
  s.stats.health = randInt(s, 70, 95);
  applyBackground(s, char.background);
  s.history.push({ year: s.year, age, text: `${char.firstName} ${char.lastName}, age ${age}, living in ${s.char.country}. Dreams of becoming a ${prof.name.toLowerCase()}.`, tone: "neutral" });
  return s;
}

function applyBackground(s: GameState, bg: Background) {
  const last = s.char.lastName;
  if (bg !== "single") s.npcs.push(makeNpc(s, "father", s.age + randInt(s, 24, 36), last));
  s.npcs.push(makeNpc(s, "mother", s.age + randInt(s, 22, 34), last));
  const sibs = randInt(s, 0, 2);
  for (let i = 0; i < sibs; i++) s.npcs.push(makeNpc(s, "sibling", clamp(s.age + randInt(s, -5, 5), 3, 30), last));
  for (let i = 0; i < 2; i++) s.npcs.push(makeNpc(s, "friend", clamp(s.age + randInt(s, -1, 1), 12, 20)));
  if (bg === "affluent") s.stats.mood += 5;
  if (bg === "struggling") { s.stats.mood -= 5; s.stats.health -= 5; }
}

export const levelFor = (skill: number) => LEVEL_THRESHOLDS.reduce((lvl, t, i) => (skill >= t ? i : lvl), 0);
export const canWork = (s: GameState) => s.age >= 18 || (s.era === "oldwest" && s.age >= 15);

/** Advances exactly one year and queues the year's event. */
export function advanceYear(prev: GameState): GameState {
  if (prev.pending || !prev.alive) return prev;
  const s: GameState = structuredClone(prev);
  s.age += 1;
  s.year += 1;
  s.lastOutcome = null;
  const prof = getProfession(s.career.profession);
  const notes: string[] = [];

  // Aging & drift
  s.npcs.forEach((n) => { n.age += 1; n.relation = clamp(n.relation + randInt(s, -4, 2)); });
  for (const n of s.npcs) {
    if (n.alive && n.age > 70 && rand(s) < (n.age - 65) / 120) {
      n.alive = false;
      s.stats.mood = clamp(s.stats.mood - 15);
      notes.push(`${n.name} passed away at ${n.age}.`);
    }
  }
  s.stats.energy = clamp(70 + randInt(s, 0, 25) - Math.max(0, s.age - 50) / 2);
  if (s.age > 40) s.stats.health = clamp(s.stats.health - randInt(s, 0, Math.floor((s.age - 35) / 8)));
  s.stats.mood = clamp(s.stats.mood + (50 - s.stats.mood) * 0.1);
  if (s.education === "in school") s.stats.intelligence = clamp(s.stats.intelligence + randInt(s, 1, 3));

  // Education milestone
  if (s.education === "in school" && s.age >= 18) {
    s.education = "graduated";
    notes.push(`Finished ${ERAS[s.era].schoolLabel.toLowerCase()}.`);
    unlock(s, "Graduate");
  }

  // Career level
  const lvl = levelFor(s.career.skill);
  if (lvl > s.career.level) {
    s.career.level = lvl;
    const t = prof.titles[Math.min(lvl, prof.titles.length - 1)];
    s.career.milestones.push(`${s.year}: became ${t}`);
    notes.push(`Promoted: now a ${t}.`);
    if (lvl === prof.titles.length - 1) unlock(s, `Peak ${prof.name}`);
  }

  // Money
  if (canWork(s)) {
    const salary = Math.round(prof.salaries[s.career.level] * (0.8 + s.stats.reputation / 250));
    const cost = s.era === "oldwest" ? 60 + s.age * 2 : 6000 + s.career.level * 4000;
    const living = Math.min(cost, Math.max(0, s.money + salary));
    s.money = Math.max(0, s.money + salary - living);
    if (salary) notes.push(`Earned ${fmtMoney(salary)}, spent ${fmtMoney(living)} on living.`);
  } else {
    const allowance = s.char.background === "affluent" ? 600 : s.char.background === "struggling" ? 20 : 150;
    s.money += s.era === "oldwest" ? Math.round(allowance / 40) : allowance;
  }
  if (s.money >= (s.era === "oldwest" ? 5000 : 1_000_000)) unlock(s, "Fortune");

  s.career.sessionsThisYear = 0;
  s.restedThisYear = false;
  s.workSessionsThisYear = 0;

  // Mortality
  const risk = s.stats.health <= 0 ? 1 : s.age > 60 ? ((s.age - 60) / 40) ** 2 * (1.4 - s.stats.health / 100) : 0;
  if (rand(s) < risk) {
    s.alive = false;
    s.deathAge = s.age;
    s.history.push({ year: s.year, age: s.age, text: `Passed away at age ${s.age}.`, tone: "bad" });
    return s;
  }

  s.history.push({ year: s.year, age: s.age, text: notes.length ? notes.join(" ") : "A quiet year went by.", tone: "neutral" });

  // Pick event
  const pool = EVENTS.filter((e) => !e.when || e.when(s));
  const total = pool.reduce((a, e) => a + (e.weight ?? 1), 0);
  let r = rand(s) * total;
  const ev = pool.find((e) => (r -= e.weight ?? 1) <= 0) ?? pool[0];
  s.pending = { id: ev.id, title: ev.title, text: ev.text(s), choices: ev.choices.map((c) => c.label) };
  return s;
}

export function resolveEvent(prev: GameState, choiceIdx: number): GameState {
  if (!prev.pending) return prev;
  const s: GameState = structuredClone(prev);
  const ev = EVENTS.find((e) => e.id === s.pending!.id);
  const choice = ev?.choices[choiceIdx];
  if (!ev || !choice) { s.pending = null; return s; }
  const fx = new Fx(s);
  const out = choice.run(fx, s);
  s.history.push({ year: s.year, age: s.age, text: `${ev.title}: ${out.text}`, tone: tone(out) });
  s.pending = null;
  s.lastOutcome = out;
  if (s.stats.health <= 0) { s.alive = false; s.deathAge = s.age; s.history.push({ year: s.year, age: s.age, text: `Passed away at age ${s.age}.`, tone: "bad" }); }
  return s;
}

const tone = (o: Outcome): "good" | "bad" | "neutral" => {
  const sum = o.deltas.reduce((a, d) => a + Math.sign(d.value), 0);
  return sum > 0 ? "good" : sum < 0 ? "bad" : "neutral";
};

export const TRAINING_ENERGY = 15;

/** Apply a mini-game practice result. Does NOT advance time; costs energy. score 0..1 */
export function applyTraining(prev: GameState, game: string, score: number): { state: GameState; outcome: Outcome } {
  const s: GameState = structuredClone(prev);
  const fx = new Fx(s);
  const diminishing = Math.max(0.35, 1 - s.career.sessionsThisYear * 0.2);
  const gain = Math.round((1 + score * 5) * diminishing);
  fx.stat("energy", -TRAINING_ENERGY).skill(gain);
  if (score > 0.7) fx.stat("mood", 3).stat("reputation", 1);
  else if (score < 0.25) fx.stat("mood", -2);
  s.career.sessionsThisYear += 1;
  const best = s.career.bestScores[game] ?? 0;
  if (score > best) s.career.bestScores[game] = Math.round(score * 100) / 100;
  if (score >= 0.95) unlock(s, `Flawless: ${game}`);
  return { state: s, outcome: fx.outcome(`Practice session (${Math.round(score * 100)}%).`) };
}

export function unlock(s: GameState, name: string) {
  if (!s.achievements.includes(name)) {
    s.achievements.push(name);
    s.history.push({ year: s.year, age: s.age, text: `Achievement unlocked: ${name}.`, tone: "good" });
  }
}


export type LifeActivity = "rest" | "study" | "work" | "socialize" | "volunteer";

export function runActivity(prev: GameState, activity: LifeActivity): { state: GameState; outcome: Outcome } {
  if (!prev.alive || prev.pending) return { state: prev, outcome: { text: "Unavailable right now.", deltas: [] } };
  const s: GameState = structuredClone(prev);
  const fx = new Fx(s);
  const finish = (message: string) => {
    const out = fx.outcome(message);
    s.lastOutcome = out;
    s.history.push({ year: s.year, age: s.age, text: message, tone: tone(out) });
    return { state: s, outcome: out };
  };
  if (activity === "rest") {
    if (s.restedThisYear) return { state: prev, outcome: { text: "You've already rested this year.", deltas: [] } };
    s.restedThisYear = true;
    fx.stat("energy", 35).stat("mood", 4);
    return finish("You took time to rest and recharge.");
  }
  const costs = { study: 12, work: 20, socialize: 10, volunteer: 15 } as const;
  const cost = costs[activity];
  if (s.stats.energy < cost) return { state: prev, outcome: { text: "Not enough energy.", deltas: [] } };
  if (activity === "study") {
    fx.stat("energy", -cost).stat("intelligence", 4);
    return finish("You spent the afternoon studying.");
  }
  if (activity === "work") {
    if (!canWork(s)) return { state: prev, outcome: { text: "You are not old enough to work yet.", deltas: [] } };
    if ((s.workSessionsThisYear ?? 0) >= 2) return { state: prev, outcome: { text: "You reached this year's work limit.", deltas: [] } };
    const pay = s.era === "oldwest" ? randInt(s, 6, 12) : randInt(s, 180, 320);
    s.workSessionsThisYear = (s.workSessionsThisYear ?? 0) + 1;
    fx.stat("energy", -cost).money(pay).stat("reputation", 1);
    return finish("You completed a shift and earned " + fmtMoney(pay) + ".");
  }
  if (activity === "socialize") {
    fx.stat("energy", -cost).stat("mood", 6).rel("friend", 7).rel("family", 2);
    return finish("You spent time with people close to you.");
  }
  fx.stat("energy", -cost).stat("reputation", 3).stat("mood", 2);
  return finish("You helped out in your community.");
}

export const fmtMoney = (n: number) => "$" + Math.round(n).toLocaleString("en-US");