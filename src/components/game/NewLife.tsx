import { useState } from "react";
import { ChevronLeft, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BACKGROUNDS, COUNTRIES, ERAS, FIRST_NAMES, HAIR_COLORS, LAST_NAMES, PROFESSIONS, SHIRT_COLORS, SKIN_TONES, type Background, type ProfessionId, getProfession } from "@/game/config";
import { createLife } from "@/game/engine";
import { setGame } from "@/game/store";
import type { Appearance } from "@/game/types";
import { Avatar } from "./Avatar";
import { cn } from "@/lib/utils";

const rnd = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

export function NewLife({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const [step, setStep] = useState<0 | 1>(0);
  const [prof, setProf] = useState<ProfessionId | null>(null);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [age, setAge] = useState(15);
  const [country, setCountry] = useState("United States");
  const [bg, setBg] = useState<Background>("ordinary");
  const [ap, setAp] = useState<Appearance>({ skin: 1, hair: 0, shirt: 0 });

  const p = prof ? getProfession(prof) : null;
  const era = p ? ERAS[p.era] : ERAS.modern;

  const randomize = () => {
    setFirst(rnd(FIRST_NAMES[era.id]));
    setLast(rnd(LAST_NAMES[era.id]));
    setAp({ skin: Math.floor(Math.random() * 5), hair: Math.floor(Math.random() * 5), shirt: Math.floor(Math.random() * 5) });
  };

  const start = () => {
    if (!prof || !first.trim() || !last.trim()) return;
    setGame(createLife({ profession: prof, age, char: { firstName: first.trim(), lastName: last.trim(), pronouns, country, background: bg, appearance: ap } }));
    onDone();
  };

  const categories = ["Sport", "Creativity", "Others"] as const;

  return (
    <div className="flex min-h-dvh flex-col safe-top">
      <header className="flex items-center gap-2 px-3 pb-2">
        <Button variant="ghost" size="icon" className="size-11" onClick={() => (step === 0 ? onBack() : setStep(0))} aria-label="Back">
          <ChevronLeft />
        </Button>
        <h2 className="text-xl font-bold">{step === 0 ? "Choose your path" : "Who are you?"}</h2>
        <span className="ml-auto pr-2 text-sm text-muted-foreground">{step + 1}/2</span>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-32">
        {step === 0 &&
          categories.map((cat) => (
            <section key={cat} className="mb-6">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{cat}</h3>
              <div className="grid gap-2">
                {PROFESSIONS.filter((x) => x.category === cat).map((x) => (
                  <button
                    key={x.id}
                    disabled={x.wip}
                    onClick={() => setProf(x.id)}
                    className={cn(
                      "flex items-center gap-4 rounded-2xl border bg-card p-4 text-left transition-all",
                      prof === x.id && "border-primary glow",
                      x.wip && "opacity-45",
                    )}
                  >
                    <span className="grid size-12 place-items-center rounded-xl bg-secondary text-2xl">{x.emoji}</span>
                    <span className="flex-1">
                      <span className="flex items-center gap-2 font-semibold">
                        {x.name}
                        {x.wip && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">W.I.P.</span>}
                        {x.era === "oldwest" && <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">1850–1916</span>}
                      </span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">{x.blurb}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}

        {step === 1 && p && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 rounded-2xl border bg-card p-4">
              <Avatar a={ap} size={72} hat={p.id === "cowboy"} />
              <div className="flex-1">
                <div className="font-semibold">{first || "First"} {last || "Last"}</div>
                <div className="text-sm text-muted-foreground">{p.name} · {era.label}</div>
              </div>
              <Button variant="secondary" size="icon" className="size-11" onClick={randomize} aria-label="Randomize"><Shuffle /></Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="First name"><Input className="h-12 text-base" value={first} onChange={(e) => setFirst(e.target.value)} maxLength={20} /></Field>
              <Field label="Surname"><Input className="h-12 text-base" value={last} onChange={(e) => setLast(e.target.value)} maxLength={20} /></Field>
            </div>
            <Field label="Pronouns (optional)"><Input className="h-12 text-base" placeholder="e.g. she/her, he/him, they/them" value={pronouns} onChange={(e) => setPronouns(e.target.value)} maxLength={20} /></Field>

            <Field label="Look">
              <Swatches label="Skin" colors={SKIN_TONES} value={ap.skin} onChange={(v) => setAp({ ...ap, skin: v })} />
              <Swatches label="Hair" colors={HAIR_COLORS} value={ap.hair} onChange={(v) => setAp({ ...ap, hair: v })} />
              <Swatches label="Outfit" colors={SHIRT_COLORS} value={ap.shirt} onChange={(v) => setAp({ ...ap, shirt: v })} />
            </Field>

            <Field label={`Starting age: ${age}`}>
              <div className="grid grid-cols-5 gap-2">
                {[13, 14, 15, 16, 17].map((a) => (
                  <Button key={a} variant={a === age ? "default" : "secondary"} className="h-12 text-base" onClick={() => setAge(a)}>{a}</Button>
                ))}
              </div>
            </Field>

            <Field label="Country of birth">
              {p.fixedCountry ? (
                <div className="rounded-xl border bg-card px-4 py-3 text-sm">{p.fixedCountry} <span className="text-muted-foreground">(set by era)</span></div>
              ) : (
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="h-12 text-base"><SelectValue /></SelectTrigger>
                  <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              )}
            </Field>

            <Field label="Background">
              <div className="grid grid-cols-2 gap-2">
                {BACKGROUNDS.map((b) => (
                  <button key={b.id} onClick={() => setBg(b.id)} className={cn("rounded-xl border bg-card p-3 text-left", bg === b.id && "border-primary glow")}>
                    <div className="text-sm font-semibold">{b.label}</div>
                    <div className="text-xs text-muted-foreground">{b.desc}</div>
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t bg-background/90 px-4 pt-3 backdrop-blur safe-bottom">
        {step === 0 ? (
          <Button className="h-14 w-full rounded-2xl text-base" disabled={!prof} onClick={() => { setStep(1); if (!first) randomize(); }}>
            Continue{p ? ` as ${p.name}` : ""}
          </Button>
        ) : (
          <Button className="h-14 w-full rounded-2xl text-base glow" disabled={!first.trim() || !last.trim()} onClick={start}>Begin life</Button>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

function Swatches({ label, colors, value, onChange }: { label: string; colors: string[]; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="w-14 text-sm text-muted-foreground">{label}</span>
      {colors.map((c, i) => (
        <button key={i} aria-label={`${label} ${i + 1}`} onClick={() => onChange(i)} className={cn("size-9 rounded-full ring-offset-2 ring-offset-background", value === i && "ring-2 ring-primary")} style={{ background: c }} />
      ))}
    </div>
  );
}