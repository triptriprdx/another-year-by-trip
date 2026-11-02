import { useState } from "react";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ERAS, getProfession } from "@/game/config";
import { advanceYear, applyTraining, fmtMoney, interactWithNpc, resolveEvent, runActivity, TRAINING_ENERGY } from "@/game/engine";
import { setGame } from "@/game/store";
import type { GameState, Outcome } from "@/game/types";
import { Avatar } from "./Avatar";
import { Minigame } from "./Minigames";
import { cn } from "@/lib/utils";

const TABS = ["Life", "Career", "Activities", "People", "Money", "History"] as const;

export function GameScreen({ g, onMenu }: { g: GameState; onMenu: () => void }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Life");
  const [playing, setPlaying] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const prof = getProfession(g.career.profession);
  const era = ERAS[g.era];

  const choose = (i: number) => { const n = resolveEvent(g, i); setGame(n); setOutcome(n.lastOutcome); };
  const doActivity = (id: "rest" | "study" | "work" | "socialize" | "volunteer") => { const r = runActivity(g, id); if (r.state !== g) setGame(r.state); setOutcome(r.outcome); };
  const doNpcAction = (id: string, action: "talk" | "gift" | "help") => { const r = interactWithNpc(g, id, action); if (r.state !== g) setGame(r.state); setOutcome(r.outcome); };

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
        {tab === "Activities" && <Card><div className="mb-1 text-lg font-semibold">Your day</div><p className="mb-3 text-sm text-muted-foreground">Actions take place within this year. The calendar only moves when you advance a year.</p><div className="grid gap-2"><ActivityButton title="Rest" detail={g.restedThisYear ? "Already rested this year" : "+35 energy · once per year"} disabled={!!g.restedThisYear || !g.alive} onClick={() => doActivity("rest")} /><ActivityButton title="Study" detail="−12 energy · +4 intelligence" disabled={g.stats.energy < 12 || !g.alive} onClick={() => doActivity("study")} /><ActivityButton title="Work a shift" detail="−20 energy · earn money · max 2 shifts/year" disabled={g.stats.energy < 20 || !((g.age >= 18) || (g.era === "oldwest" && g.age >= 15)) || (g.workSessionsThisYear ?? 0) >= 2 || !g.alive} onClick={() => doActivity("work")} /><ActivityButton title="Socialize" detail="−10 energy · improve mood and relationships" disabled={g.stats.energy < 10 || !g.alive} onClick={() => doActivity("socialize")} /><ActivityButton title="Volunteer" detail="−15 energy · +reputation" disabled={g.stats.energy < 15 || !g.alive} onClick={() => doActivity("volunteer")} /></div></Card>}
        {tab === "People" && g.npcs.map((n) => (
          <Card key={n.id}>
            <div className="flex justify-between"><span className="font-semibold">{n.name}</span><span className="text-xs capitalize text-muted-foreground">{n.role}{n.alive ? `, ${n.age}` : " (deceased)"}</span></div>
            <div className="text-xs text-muted-foreground">{n.trait}</div>
            <Progress value={n.relation} className="mt-2 h-2" /><div className="mt-3 grid grid-cols-3 gap-2"><Button size="sm" variant="secondary" disabled={!n.alive || !g.alive || g.stats.energy < 5} onClick={() => doNpcAction(n.id, "talk")}>Talk</Button><Button size="sm" variant="secondary" disabled={!n.alive || !g.alive || g.money < (g.era === "oldwest" ? 8 : 250)} onClick={() => doNpcAction(n.id, "gift")}>Gift</Button><Button size="sm" variant="secondary" disabled={!n.alive || !g.alive || g.stats.energy < 12} onClick={() => doNpcAction(n.id, "help")}>Help</Button></div>
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
        <nav className="grid grid-cols-6 gap-1">
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

const ActivityButton = ({ title, detail, disabled, onClick }: { title: string; detail: string; disabled: boolean; onClick: () => void }) => <Button variant="secondary" className="h-auto min-h-14 justify-between whitespace-normal py-3 text-left" disabled={disabled} onClick={onClick}><span className="font-semibold">{title}</span><span className="ml-3 text-xs text-muted-foreground">{detail}</span></Button>;
const Card = ({ children }: { children: React.ReactNode }) => <div className="rounded-2xl border bg-card p-4">{children}</div>;
const Stat = ({ label, v }: { label: string; v: number }) => (
  <div className="py-1.5"><div className="flex justify-between text-sm capitalize"><span>{label}</span><span className="font-semibold">{v}</span></div><Progress value={v} className="mt-1 h-2" /></div>
);