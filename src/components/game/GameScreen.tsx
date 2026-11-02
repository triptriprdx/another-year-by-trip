import { useState } from "react";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ERAS, getProfession, HAIR_COLORS, SHIRT_COLORS, SKIN_TONES } from "@/game/config";
import { advanceYear, applyTraining, fmtMoney, interactWithNpc, purchaseAsset, resolveEvent, runActivity, TRAINING_ENERGY } from "@/game/engine";
import { setGame } from "@/game/store";
import type { GameState, Outcome } from "@/game/types";
import { Avatar } from "./Avatar";
import { Minigame } from "./Minigames";
import { cn } from "@/lib/utils";

const TABS = ["Life", "Career", "Activities", "People", "Wardrobe", "Money", "History"] as const;

export function GameScreen({ g, onMenu }: { g: GameState; onMenu: () => void }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Life");
  const [playing, setPlaying] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const prof = getProfession(g.career.profession);
  const era = ERAS[g.era];

  const choose = (i: number) => { const n = resolveEvent(g, i); setGame(n); setOutcome(n.lastOutcome); };
  const doActivity = (id: "rest" | "study" | "work" | "socialize" | "volunteer") => { const r = runActivity(g, id); if (r.state !== g) setGame(r.state); setOutcome(r.outcome); };
  const doNpcAction = (id: string, action: "talk" | "gift" | "help") => { const r = interactWithNpc(g, id, action); if (r.state !== g) setGame(r.state); setOutcome(r.outcome); };
  const buyAsset = (kind: "home" | "transport", level: number) => { const r = purchaseAsset(g, kind, level); if (r.state !== g) setGame(r.state); setOutcome(r.outcome); };
  const changeLook = (key: "skin" | "hair" | "shirt", value: number) => { const next = structuredClone(g); next.char.appearance[key] = value; setGame(next); };

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
            <div className="mt-4 rounded-2xl border bg-background p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-primary">Career mini-game</div>
              <div className="mt-1 text-base font-semibold">{({
                footballer: "Penalty challenge",
                chess: "Chess puzzles",
                boxer: "Boxing tactics",
                musician: "Music studio",
                artist: "Drawing studio",
                cowboy: "Frontier reflex test",
                actor: "Acting challenge",
              } as Record<string, string>)[g.career.profession]}</div>
              <p className="mt-1 text-sm text-muted-foreground">{({
                footballer: "Time five shots and build your ball-control skill.",
                chess: "Solve two chess positions using legal moves.",
                boxer: "Read five situations and choose a balanced response.",
                musician: "Repeat melodies, then compose your own four-beat phrase.",
                artist: "Draw an original sketch on the canvas.",
                cowboy: "Complete a reaction-time challenge.",
                actor: "This mini-game is still in development.",
              } as Record<string, string>)[g.career.profession]}</p>
              <Button className="mt-3 h-12 w-full" disabled={g.stats.energy < TRAINING_ENERGY || !g.alive || g.career.profession === "actor"} onClick={() => setPlaying(true)}>Start mini-game</Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">Costs {TRAINING_ENERGY} energy · does not advance the year · Energy: {g.stats.energy}</p>
            </div>
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
        {tab === "Wardrobe" && <Card><div className="mb-3 text-lg font-semibold">Wardrobe</div><p className="mb-4 text-sm text-muted-foreground">Change your look whenever you want. It does not cost money or advance time.</p><div className="mb-4 flex items-center gap-4"><Avatar a={g.char.appearance} size={88} hat={g.era === "oldwest"} /><div><div className="font-semibold">{g.char.firstName} {g.char.lastName}</div><div className="text-xs text-muted-foreground">{prof.name}</div></div></div><Palette label="Skin tone" colors={SKIN_TONES} value={g.char.appearance.skin} onChange={(v) => changeLook("skin",v)} /><Palette label="Hair" colors={HAIR_COLORS} value={g.char.appearance.hair} onChange={(v) => changeLook("hair",v)} /><Palette label="Outfit" colors={SHIRT_COLORS} value={g.char.appearance.shirt} onChange={(v) => changeLook("shirt",v)} /></Card>}
        {tab === "Money" && <><Card><div className="text-sm text-muted-foreground">{era.moneyLabel}</div><div className="text-3xl font-bold">{fmtMoney(g.money)}</div><p className="mt-2 text-sm text-muted-foreground">Education: {g.education}</p><p className="mt-2 text-sm">Home: {["None","Modest","Comfortable","Premium"][g.homeLevel ?? 0]} · Transport: {g.era === "oldwest" ? ["None","Bicycle","Horse","Carriage"][g.transportLevel ?? 0] : ["None","Bicycle","Used car","New car"][g.transportLevel ?? 0]}</p><p className="mt-1 text-xs text-muted-foreground">Owned assets have yearly upkeep costs.</p></Card><Card><div className="mb-3 font-semibold">Property</div><div className="grid gap-2">{[1,2,3].map((level) => <Button key={level} variant="secondary" className="justify-between" disabled={!g.alive || (g.homeLevel ?? 0) + 1 !== level || g.money < (g.era === "oldwest" ? [0,250,800,2500][level] : [0,25000,90000,300000][level])} onClick={() => buyAsset("home",level)}><span>{["","Modest home","Comfortable home","Premium home"][level]}</span><span className="text-xs">{fmtMoney(g.era === "oldwest" ? [0,250,800,2500][level] : [0,25000,90000,300000][level])}</span></Button>)}</div></Card><Card><div className="mb-3 font-semibold">Transport</div><div className="grid gap-2">{[1,2,3].map((level) => <Button key={level} variant="secondary" className="justify-between" disabled={!g.alive || (g.transportLevel ?? 0) + 1 !== level || g.money < (g.era === "oldwest" ? [0,80,350,1200][level] : [0,500,12000,45000][level])} onClick={() => buyAsset("transport",level)}><span>{g.era === "oldwest" ? ["","Sturdy bicycle","Horse","Fine carriage"][level] : ["","Bicycle","Used car","New car"][level]}</span><span className="text-xs">{fmtMoney(g.era === "oldwest" ? [0,80,350,1200][level] : [0,500,12000,45000][level])}</span></Button>)}</div></Card></>}
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
        <nav aria-label="Game sections" className="flex gap-1 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} aria-current={tab === t ? "page" : undefined} className={cn("h-11 min-w-[68px] shrink-0 rounded-xl px-2 text-xs font-semibold", tab === t ? "bg-secondary text-foreground" : "text-muted-foreground")}>{t}</button>
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

      {playing && (
        <section className="fixed inset-0 z-[100] flex min-h-dvh flex-col overflow-y-auto bg-background safe-top safe-bottom" aria-label="Career mini-game">
          <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur">
            <Button variant="ghost" size="icon" className="size-11 shrink-0" onClick={() => setPlaying(false)} aria-label="Exit mini-game"><ArrowLeft /></Button>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold uppercase tracking-wider text-primary">Career mini-game</div>
              <div className="truncate font-semibold">{({
                footballer: "Penalty challenge",
                chess: "Chess puzzles",
                boxer: "Boxing tactics",
                musician: "Music studio",
                artist: "Drawing studio",
                cowboy: "Frontier reflex test",
                actor: "Acting challenge",
              } as Record<string, string>)[g.career.profession]}</div>
            </div>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">−{TRAINING_ENERGY} energy</span>
          </header>
          <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 py-6">
            <p className="mb-5 text-center text-sm text-muted-foreground">Complete the challenge to train your career skill. The year will not advance.</p>
            <div className="rounded-3xl border bg-card p-4 shadow-sm sm:p-6">
              <Minigame prof={g.career.profession} onDone={(score) => { const r = applyTraining(g, prof.id, score); setGame(r.state); setPlaying(false); setOutcome(r.outcome); }} />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

const Palette = ({ label, colors, value, onChange }: { label: string; colors: string[]; value: number; onChange: (v: number) => void }) => <div className="mb-4"><div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div><div className="flex flex-wrap gap-3">{colors.map((color, i) => <button key={i} aria-label={`${label} ${i + 1}`} onClick={() => onChange(i)} className={cn("size-10 rounded-full border-2 border-background ring-offset-2 ring-offset-background", value === i && "ring-2 ring-primary")} style={{ background: color }} />)}</div></div>;
const ActivityButton = ({ title, detail, disabled, onClick }: { title: string; detail: string; disabled: boolean; onClick: () => void }) => <Button variant="secondary" className="h-auto min-h-14 justify-between whitespace-normal py-3 text-left" disabled={disabled} onClick={onClick}><span className="font-semibold">{title}</span><span className="ml-3 text-xs text-muted-foreground">{detail}</span></Button>;
const Card = ({ children }: { children: React.ReactNode }) => <div className="rounded-2xl border bg-card p-4">{children}</div>;
const Stat = ({ label, v }: { label: string; v: number }) => (
  <div className="py-1.5"><div className="flex justify-between text-sm capitalize"><span>{label}</span><span className="font-semibold">{v}</span></div><Progress value={v} className="mt-1 h-2" /></div>
);