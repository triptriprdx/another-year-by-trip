import { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Button } from "@/components/ui/button";
import type { ProfessionId } from "@/game/config";

type Done = (score: number) => void;

function Football({ onDone }: { onDone: Done }) {
  const [scale, setScale] = useState(3);
  const [scores, setScores] = useState<number[]>([]);
  const [label, setLabel] = useState("Tap when the ring reaches the ball");
  const start = useRef(performance.now());
  const ended = useRef(false);
  useEffect(() => {
    let raf = 0;
    const loop = (t: number) => { setScale(3 - (((t - start.current) % 1400) / 1400) * 2.6); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  const kick = () => {
    if (ended.current) return;
    const d = Math.abs(scale - 1);
    const v = d < .08 ? 1 : d < .2 ? .7 : d < .4 ? .35 : 0;
    const next = [...scores, v]; setScores(next); start.current = performance.now();
    setLabel(v === 1 ? "Perfect!" : v >= .7 ? "Great!" : v > 0 ? "A little off" : "Missed");
    if (next.length === 5) { ended.current = true; setTimeout(() => onDone(next.reduce((a,b)=>a+b,0)/5), 450); }
  };
  return <div className="flex flex-col items-center gap-5 py-5"><p className="font-semibold">{label}</p><button onPointerDown={kick} className="relative grid size-56 place-items-center" aria-label="Strike the ball"><span className="absolute size-24 rounded-full border-4 border-primary" style={{transform:`scale(${scale})`}}/><span className="grid size-24 place-items-center rounded-full bg-secondary text-5xl">⚽</span></button><p className="text-sm text-muted-foreground">Attempt {Math.min(scores.length+1,5)} / 5</p></div>;
}

function ChessPuzzles({onDone}:{onDone:Done}) {
  const puzzles = [
    {instruction:"White to move. Find checkmate in one move.",fen:"7k/8/5KQ1/8/8/8/8/8 w - - 0 1",win:(c:Chess)=>c.isCheckmate()},
    {instruction:"Black is in check. Find any legal move that escapes check.",fen:"7k/6pp/5K2/8/8/8/8/7R b - - 0 1",win:(c:Chess)=>!c.isCheck()&&c.turn()==="w"},
  ];
  const [idx,setIdx]=useState(0),[game,setGame]=useState(()=>new Chess(puzzles[0].fen)),[from,setFrom]=useState<string|null>(null),[message,setMessage]=useState(""),[done,setDone]=useState(false);
  const p=puzzles[idx];
  const tap=(sq:string)=>{
    if(done)return;
    const piece=game.get(sq as never);
    if(!from){if(piece&&piece.color===game.turn())setFrom(sq);return;}
    if(piece&&piece.color===game.turn()){setFrom(sq);return;}
    const next=new Chess(game.fen());
    try{next.move({from,to:sq,promotion:"q"});}catch{setMessage("Illegal move — try again.");setFrom(null);return;}
    setFrom(null);
    if(p.win(next)){setGame(next);setDone(true);setMessage("Correct!");}
    else{setGame(new Chess(p.fen));setMessage("Not quite. Try again.");}
  };
  const reset=()=>{setGame(new Chess(p.fen));setFrom(null);setMessage("");setDone(false);};
  const advance=()=>{if(idx===0){setIdx(1);setGame(new Chess(puzzles[1].fen));setMessage("");setDone(false);}else onDone(1);};
  const glyph:Record<string,string>={wk:"♔",wq:"♕",wr:"♖",wb:"♗",wn:"♘",wp:"♙",bk:"♚",bq:"♛",br:"♜",bb:"♝",bn:"♞",bp:"♟"};
  return <div className="space-y-3 py-2"><p className="text-sm text-muted-foreground">Puzzle {idx+1}/2 · {p.instruction}</p><div className="mx-auto grid aspect-square w-full max-w-[340px] grid-cols-8 overflow-hidden rounded-xl">{game.board().flatMap((row,r)=>row.map((piece,f)=>{const sq=`${"abcdefgh"[f]}${8-r}`;return <button key={sq} onClick={()=>tap(sq)} className={`grid aspect-square place-items-center text-[clamp(1.5rem,8vw,2.7rem)] ${(r+f)%2?"bg-[#769656]":"bg-[#eeeed2]"} ${from===sq?"ring-4 ring-inset ring-yellow-400":""}`} aria-label={sq}><span className={piece?.color==="b"?"text-[#202020]":"text-white [text-shadow:0_1px_3px_#333]"}>{piece?glyph[piece.color+piece.type]:""}</span></button>;}))}</div><p className="min-h-5 text-center text-sm">{message}</p><div className="flex gap-2"><Button variant="secondary" className="flex-1" onClick={reset}>Restart</Button>{done&&<Button className="flex-1" onClick={advance}>{idx===0?"Next puzzle":"Finish"}</Button>}</div></div>;
}

function Boxer({onDone}:{onDone:Done}) {
  const [round,setRound]=useState(0),[choice,setChoice]=useState(""),[score,setScore]=useState(0),[feedback,setFeedback]=useState("Read the cue, then choose your response.");
  const cues=["Opponent overcommits","You have room to reset","A feint appears","The pace slows","You spot an opening"];
  const options=[{id:"counter",label:"Counter",icon:"↩"},{id:"guard",label:"Stay balanced",icon:"◈"},{id:"move",label:"Move aside",icon:"↗"}];
  const best=["counter","guard","move","guard","counter"];
  const select=(id:string)=>{if(choice)return;const good=id===best[round];setChoice(id);setFeedback(good?"Good read — you kept control.":"Poor read — you lost your rhythm.");setScore(s=>s+(good?1:0));};
  const next=()=>{if(round===4){onDone(score/5);return;}setRound(r=>r+1);setChoice("");setFeedback("Choose your response.");};
  return <div className="space-y-5 py-3"><div className="flex justify-between text-sm text-muted-foreground"><span>Round {round+1} / 5</span><span>Good reads: {score}</span></div><div className="rounded-2xl bg-secondary p-6 text-center"><div className="text-4xl">🥊</div><p className="mt-3 text-lg font-semibold">{cues[round]}</p><p className="mt-1 text-sm text-muted-foreground">A tactical boxing simulation. No real fighting techniques.</p></div><div className="grid grid-cols-3 gap-2">{options.map(o=><Button key={o.id} variant={choice===o.id?"default":"secondary"} className="h-20 flex-col gap-1" disabled={!!choice} onClick={()=>select(o.id)}><span className="text-xl">{o.icon}</span>{o.label}</Button>)}</div><p className="min-h-10 text-center text-sm">{feedback}</p>{choice&&<Button className="h-12 w-full" onClick={next}>{round===4?"Finish training":"Next round"}</Button>}</div>;
}

function Musician({onDone}:{onDone:Done}) {
  const patterns=[[0,2,1,3],[1,3,0,2],[2,0,3,1]];
  const [round,setRound]=useState(0),[step,setStep]=useState(0),[score,setScore]=useState(0),[message,setMessage]=useState("Repeat the four-note melody.");
  const notes=["C","D","E","G"];
  const play=(i:number)=>{if(i!==patterns[round][step]){setMessage("Wrong note — try this melody again.");setStep(0);return;}if(step===3){const next=score+1;setScore(next);setMessage("Melody complete!");if(round===2)setTimeout(()=>onDone(next/3),500);else setTimeout(()=>{setRound(r=>r+1);setStep(0);setMessage("New melody. Repeat it.");},700);}else setStep(s=>s+1);};
  return <div className="space-y-5 py-4"><p className="text-center text-sm text-muted-foreground">Melody {round+1}/3 · Note {step+1}/4</p><p className="text-center font-semibold">{message}</p><div className="grid grid-cols-4 gap-2">{notes.map((n,i)=><button key={n} onClick={()=>play(i)} className={`h-36 rounded-xl border-b-8 text-xl font-bold active:translate-y-1 active:border-b-2 ${i%2?"bg-secondary":"bg-card"}`}>{n}</button>)}</div><p className="text-center text-xs text-muted-foreground">Tap the notes in the displayed sequence: {patterns[round].map(i=>notes[i]).join(" · ")}</p></div>;
}

function Artist({onDone}:{onDone:Done}) {
  const canvas=useRef<HTMLCanvasElement>(null),drawing=useRef(false),[color,setColor]=useState("#d97757"),[strokes,setStrokes]=useState(0);
  useEffect(()=>{const c=canvas.current;if(!c)return;const ctx=c.getContext("2d");if(!ctx)return;ctx.fillStyle="#faf7f0";ctx.fillRect(0,0,c.width,c.height);},[]);
  const point=(e:React.PointerEvent<HTMLCanvasElement>)=>{const c=canvas.current;if(!c)return;const r=c.getBoundingClientRect();return {x:(e.clientX-r.left)*c.width/r.width,y:(e.clientY-r.top)*c.height/r.height};};
  const start=(e:React.PointerEvent<HTMLCanvasElement>)=>{e.currentTarget.setPointerCapture(e.pointerId);drawing.current=true;const p=point(e);const ctx=canvas.current?.getContext("2d");if(ctx&&p){ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.strokeStyle=color;ctx.lineWidth=5;ctx.lineCap="round";ctx.lineJoin="round";}};
  const move=(e:React.PointerEvent<HTMLCanvasElement>)=>{if(!drawing.current)return;const p=point(e);const ctx=canvas.current?.getContext("2d");if(ctx&&p){ctx.lineTo(p.x,p.y);ctx.stroke();}};
  const end=()=>{if(drawing.current){drawing.current=false;setStrokes(s=>s+1);}};
  const clear=()=>{const c=canvas.current;const ctx=c?.getContext("2d");if(c&&ctx){ctx.fillStyle="#faf7f0";ctx.fillRect(0,0,c.width,c.height);setStrokes(0);}};
  return <div className="space-y-3 py-2"><p className="text-sm text-muted-foreground">Create a small original sketch. Your drawing stays in this session.</p><canvas ref={canvas} width={720} height={520} onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end} className="w-full touch-none rounded-xl border bg-[#faf7f0]"/><div className="flex items-center justify-between gap-2"><div className="flex gap-2">{["#202020","#d97757","#3984a8","#4c956c","#9b72cf"].map(c=><button key={c} onClick={()=>setColor(c)} aria-label={`Choose ${c}`} className="size-8 rounded-full border-2" style={{background:c,borderColor:color===c?"white":"transparent"}}/>)}</div><Button variant="secondary" onClick={clear}>Clear</Button></div><Button className="h-12 w-full" disabled={strokes===0} onClick={()=>onDone(Math.min(1,strokes/12))}>Finish artwork</Button></div>;
}

function Cowboy({onDone}:{onDone:Done}) {
  const [phase,setPhase]=useState<"wait"|"go"|"result">("wait"),[msg,setMsg]=useState("Stay focused…"),[attempt,setAttempt]=useState(0);
  const goAt=useRef(0),timer=useRef<ReturnType<typeof setTimeout>|null>(null),done=useRef(false);
  useEffect(()=>{timer.current=setTimeout(()=>{goAt.current=performance.now();setPhase("go");},1300+Math.random()*2200);return()=>{if(timer.current)clearTimeout(timer.current);};},[attempt]);
  const tap=()=>{if(done.current||phase==="result")return;if(phase==="wait"){setMsg("Too early.");setPhase("result");done.current=true;setTimeout(()=>onDone(0),700);return;}const ms=performance.now()-goAt.current;const s=ms<260?1:ms<380?.7:ms<520?.4:.1;setMsg(`${Math.round(ms)} ms · ${s===1?"Excellent":s>=.7?"Good timing":"Too slow"}`);setPhase("result");done.current=true;setTimeout(()=>onDone(s),800);};
  return <button onPointerDown={tap} className={`grid h-72 w-full place-items-center rounded-3xl ${phase==="go"?"bg-primary text-primary-foreground":"bg-secondary"}`}><span className="text-2xl font-bold">{phase==="go"?"NOW!":msg}</span></button>;
}

export function Minigame({prof,onDone}:{prof:ProfessionId;onDone:Done}) {
  switch(prof){
    case "footballer":return <Football onDone={onDone}/>;
    case "chess":return <ChessPuzzles onDone={onDone}/>;
    case "boxer":return <Boxer onDone={onDone}/>;
    case "musician":return <Musician onDone={onDone}/>;
    case "artist":return <Artist onDone={onDone}/>;
    case "cowboy":return <Cowboy onDone={onDone}/>;
    default:return <p className="py-6 text-center text-sm text-muted-foreground">This career is not available yet.</p>;
  }
}
