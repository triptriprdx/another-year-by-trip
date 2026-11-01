import { useState } from "react";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ERAS, getProfession } from "@/game/config";
import { advanceYear, applyTraining, fmtMoney, resolveEvent, TRAINING_ENERGY } from "@/game/engine";
import { setGame } from "@/game/store";
import type { GameState, Outcome } from "@/game/types";
import { Avatar } from "./Avatar";
import { Minigame } from "./Minigames";
import { cn } from "@/lib/utils";

const TABS = ["Life", "Career", "People", "Money", "History"] as const;

export function GameScreen({ g, onMenu }: { g: GameState; onMenu: () => void }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Life");
  const [playing, setPlaying] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const prof = getProfession(g.career.profession);
  const era = ERAS[g.era];

  const choose = (i: number) => { const n = resolveEvent(g, i); setGame(n); setOutcome(n.lastOutcome); };

  return (
    <div className="flex min-h-dvh flex-col safe-top">
      <header className="flex items-center gap-3 px-4 pb-3">
        <Avatar a={g.char.appearance} size={52} hat={g.era === "oldwest"} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-bold">{g.char.firstName} {g.char.lastName}</div>
          <div className="text-xs text-muted-foreground">Age {g.age} · {g.year} · {prof.titles[g.career.level]} · {g.char.country}</div>
        </div>
        <Button variant="ghost" size="icon" className="size-11" onClick={onMenu} aria-label="Menu"><Home /></Button>
      </header>

      <main className="flex-1 space-y-3 overflow-y-auto px-4 pb-44">
        {tab === "Life" && (
          <Card>
            {(["health", "mood", "energy", "intelligence", "reputation"] as const).map((k) => (
              <Stat key={k} label={k} v={g.stats[k]} />
            ))}
            <Stat label={prof.skillName} v={g.career.skill} />
          </Card>
        )}
        {tab === "Career" && (
          <Card>
            <div className="text-lg font-semibold">{prof.emoji} {prof.titles[g.career.level]}</div>
            <p className="text-sm text-muted-foreground">Practice uses {TRAINING_ENERGY} energy and doesn't advance time. Energy: {g.stats.energy}</p>
            <Button className="mt-3 h-12 w-full" disabled={g.stats.energy < TRAINING_ENERGY || !g.alive} onClick={() => setPlaying(true)}>Practice</Button>
            {g.career.milestones.map((m) => <p key={m} className="mt-2 text-sm">{m}</p>)}
          </Card>
        )}
        {tab === "People" && g.npcs.map((n) => (
          <Card key={n.id}>
            <div className="flex justify-between"><span className="font-semibold">{n.name}</span><span className="text-xs capitalize text-muted-foreground">{n.role}{n.alive ? `, ${n.age}` : " (deceased)"}</span></div>
            <div className="text-xs text-muted-foreground">{n.trait}</div>
            <Progress value={n.relation} className="mt-2 h-2" />
          </Card>
        ))}
        {tab === "Money" && <Card><div className="text-sm text-muted-foreground">{era.moneyLabel}</div><div className="text-3xl font-bold">{fmtMoney(g.money)}</div><p className="mt-2 text-sm text-muted-foreground">Education: {g.education}</p></Card>}
        {tab === "History" && (
          <Card>
            {g.achievements.length > 0 && <p className="mb-3 text-sm text-primary">🏅 {g.achievements.join(" · ")}</p>}
            {[...g.history].reverse().map((h, i) => (
              <p key={i} className="border-b py-2 text-sm last:border-0"><span className="font-semibold text-muted-foreground">{h.age} · </span>{h.text}</p>
            ))}
          </Card>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 border-t bg-background/95 px-3 pt-3 backdrop-blur safe-bottom">
        <Button className="mb-3 h-14 w-full rounded-2xl text-lg glow" disabled={!g.alive} onClick={() => setGame(advanceYear(g))}>
          {g.alive ? "Advance Year" : `Life ended at ${g.deathAge}`}
        </Button>
        <nav className="grid grid-cols-5 gap-1">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn("h-11 rounded-xl text-xs font-semibold", tab === t ? "bg-secondary text-foreground" : "text-muted-foreground")}>{t}</button>
          ))}
        </nav>
      </div>

      <Dialog open={!!g.pending}>
        <DialogContent className="max-w-[92vw] rounded-2xl [&>button]:hidden">
          <DialogHeader><DialogTitle>{g.pending?.title}</DialogTitle><DialogDescription>Age {g.age} · {g.year}<br />{g.pending?.text}</DialogDescription></DialogHeader>
          <div className="grid gap-2">{g.pending?.choices.map((c, i) => <Button key={i} variant="secondary" className="h-auto min-h-12 whitespace-normal py-3" onClick={() => choose(i)}>{c}</Button>)}</div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!outcome} onOpenChange={(o) => !o && setOutcome(null)}>
        <DialogContent className="max-w-[92vw] rounded-2xl">
          <DialogHeader><DialogTitle>Outcome</DialogTitle><DialogDescription>{outcome?.text}</DialogDescription></DialogHeader>
          <div className="flex flex-wrap gap-2">{outcome?.deltas.map((d, i) => <span key={i} className={cn("rounded-full px-3 py-1 text-sm", d.value > 0 ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive")}>{d.label} {d.value > 0 ? "+" : ""}{d.label === "Money" ? fmtMoney(d.value) : d.value}</span>)}</div>
          <Button className="h-12" onClick={() => setOutcome(null)}>OK</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={playing} onOpenChange={setPlaying}>
        <DialogContent className="max-w-[94vw] rounded-2xl">
          <DialogHeader><DialogTitle>{prof.name} practice</DialogTitle></DialogHeader>
          {playing && <Minigame prof={g.career.profession} onDone={(score) => { const r = applyTraining(g, prof.id, score); setGame(r.state); setPlaying(false); setOutcome(r.outcome); }} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const Card = ({ children }: { children: React.ReactNode }) => <div className="rounded-2xl border bg-card p-4">{children}</div>;
const Stat = ({ label, v }: { label: string; v: number }) => (
  <div className="py-1.5"><div className="flex justify-between text-sm capitalize"><span>{label}</span><span className="font-semibold">{v}</span></div><Progress value={v} className="mt-1 h-2" /></div>
);