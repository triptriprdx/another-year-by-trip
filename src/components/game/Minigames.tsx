import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ProfessionId } from "@/game/config";

type Done = (score: number) => void;

/** Footballer: shrinking ring timing. */
function Football({ onDone }: { onDone: Done }) {
  const [scale, setScale] = useState(3);
  const [kicks, setKicks] = useState<number[]>([]);
  const [label, setLabel] = useState("Tap when the ring meets the ball");
  const start = useRef(performance.now());
  useEffect(() => {
    let raf = 0;
    const loop = (t: number) => {
      const p = ((t - start.current) % 1400) / 1400;
      setScale(3 - p * 2.6);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  const kick = () => {
    const d = Math.abs(scale - 1);
    const [g, v] = d < 0.08 ? ["Perfect!", 1] : d < 0.2 ? ["Good", 0.7] : d < 0.4 ? ["Weak", 0.35] : ["Miss", 0];
    setLabel(g as string);
    const next = [...kicks, v as number];
    setKicks(next);
    start.current = performance.now();
    if (next.length >= 5) setTimeout(() => onDone(next.reduce((a, b) => a + b, 0) / 5), 500);
  };
  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <p className="text-lg font-semibold">{label}</p>
      <button onPointerDown={kick} className="relative grid size-56 place-items-center no-select" aria-label="Kick">
        <span className="absolute size-24 rounded-full border-4 border-primary" style={{ transform: `scale(${scale})` }} />
        <span className="grid size-24 place-items-center rounded-full bg-secondary text-4xl">⚽</span>
      </button>
      <p className="text-sm text-muted-foreground">Kick {Math.min(kicks.length + 1, 5)} / 5</p>
    </div>
  );
}

/** Cowboy: reaction-time duel. */
function Duel({ onDone }: { onDone: Done }) {
  const [phase, setPhase] = useState<"wait" | "go" | "result">("wait");
  const [msg, setMsg] = useState("Steady…");
  const goAt = useRef(0);
  useEffect(() => {
    const id = setTimeout(() => { goAt.current = performance.now(); setPhase("go"); }, 1500 + Math.random() * 2500);
    return () => clearTimeout(id);
  }, []);
  const tap = () => {
    if (phase === "result") return;
    if (phase === "wait") { setMsg("Too early! Foul."); setPhase("result"); setTimeout(() => onDone(0), 900); return; }
    const ms = Math.round(performance.now() - goAt.current);
    const score = ms < 250 ? 1 : ms < 350 ? 0.7 : ms < 500 ? 0.4 : 0.1;
    setMsg(`${ms} ms — ${score === 1 ? "Perfect" : score >= 0.7 ? "Good" : score >= 0.4 ? "Weak" : "Too slow"}`);
    setPhase("result");
    setTimeout(() => onDone(score), 1100);
  };
  return (
    <button onPointerDown={tap} className={`grid h-80 w-full place-items-center rounded-3xl no-select ${phase === "go" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
      <span className="text-4xl font-extrabold">{phase === "go" ? "DRAW!" : msg}</span>
    </button>
  );
}

const Placeholder = ({ onDone }: { onDone: Done }) => (
  <div className="space-y-4 py-6 text-center">
    <p className="text-muted-foreground">This mini-game is not built yet (TODO). You can log a basic practice session instead.</p>
    <Button className="h-12" onClick={() => onDone(0.4)}>Basic practice</Button>
  </div>
);

export function Minigame({ prof, onDone }: { prof: ProfessionId; onDone: Done }) {
  if (prof === "footballer") return <Football onDone={onDone} />;
  if (prof === "cowboy") return <Duel onDone={onDone} />;
  // TODO: Chess puzzles (chess.js installed), Boxing, Rhythm + Piano roll, Drawing canvas.
  return <Placeholder onDone={onDone} />;
}