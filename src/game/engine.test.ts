import { describe, expect, it } from "vitest";
import { applyTraining, advanceYear, createLife, purchaseAsset, resolveEvent, runActivity } from "./engine";
import type { Character, GameState } from "./types";

const character: Character = {
  firstName: "Alex",
  lastName: "Taylor",
  pronouns: "",
  country: "United Kingdom",
  background: "ordinary",
  appearance: { skin: 1, hair: 0, shirt: 0 },
};

const makeGame = (seed = 123): GameState =>
  createLife({ profession: "footballer", char: character, age: 15 }, seed);

describe("life simulation engine", () => {
  it("creates a reproducible starting life", () => {
    const a = makeGame();
    const b = makeGame();
    expect(a.year).toBe(b.year);
    expect(a.stats).toEqual(b.stats);
    expect(a.char.firstName).toBe("Alex");
    expect(a.alive).toBe(true);
  });

  it("advances exactly one year and waits for an event choice", () => {
    const start = makeGame();
    const next = advanceYear(start);
    expect(next.age).toBe(start.age + 1);
    expect(next.year).toBe(start.year + 1);
    expect(next.pending).not.toBeNull();
    expect(advanceYear(next)).toBe(next);
  });

  it("resolves a selected event and records it in history", () => {
    const next = advanceYear(makeGame());
    const resolved = resolveEvent(next, 0);
    expect(resolved.pending).toBeNull();
    expect(resolved.history.length).toBeGreaterThan(next.history.length);
  });

  it("limits rest to once per year", () => {
    const start = makeGame();
    const first = runActivity(start, "rest");
    expect(first.state.restedThisYear).toBe(true);
    const second = runActivity(first.state, "rest");
    expect(second.state).toBe(first.state);
  });

  it("limits work shifts and blocks work before the allowed age", () => {
    const young = makeGame();
    expect(runActivity(young, "work").state).toBe(young);
    const adult = { ...young, age: 18, stats: { ...young.stats, energy: 100 } };
    const first = runActivity(adult, "work");
    const second = runActivity(first.state, "work");
    const third = runActivity(second.state, "work");
    expect(first.state.workSessionsThisYear).toBe(1);
    expect(second.state.workSessionsThisYear).toBe(2);
    expect(third.state).toBe(second.state);
  });

  it("requires enough energy for training and records best scores", () => {
    const tired = { ...makeGame(), stats: { ...makeGame().stats, energy: 5 } };
    expect(applyTraining(tired, "footballer", 1).state).toBe(tired);
    const trained = applyTraining(makeGame(), "footballer", 2);
    expect(trained.state.career.skill).toBeGreaterThan(5);
    expect(trained.state.career.bestScores.footballer).toBe(1);
  });

  it("only allows sequential affordable asset purchases", () => {
    const start = { ...makeGame(), money: 100_000 };
    const first = purchaseAsset(start, "home", 1);
    expect(first.state.homeLevel).toBe(1);
    expect(first.state.money).toBe(75_000);
    expect(purchaseAsset(first.state, "home", 3).state).toBe(first.state);
  });
});
