import { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
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
    const v = d < 0.08 ? 1 : d < 0.2 ? 0.7 : d < 0.4 ? 0.35 : 0;
    setLabel(v === 1 ? "Perfect!" : v >= 0.7 ? "Good" : v > 0 ? "Weak" : "Miss");
    const next = [...kicks, v];
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

/** Cowboy: abstract reaction-time test, without weapon handling. */
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
    if (phase === "wait") {
      setMsg("Too early!");
      setPhase("result");
      setTimeout(() => onDone(0), 900);
      return;
    }
    const ms = Math.round(performance.now() - goAt.current);
    const score = ms < 250 ? 1 : ms < 350 ? 0.7 : ms < 500 ? 0.4 : 0.1;
    setMsg(`${ms} ms — ${score === 1 ? "Perfect" : score >= 0.7 ? "Good" : score >= 0.4 ? "Okay" : "Too slow"}`);
    setPhase("result");
    setTimeout(() => onDone(score), 1100);
  };
  return (
    <button onPointerDown={tap} className={`grid h-80 w-full place-items-center rounded-3xl no-select ${phase === "go" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
      <span className="text-3xl font-extrabold">{phase === "go" ? "NOW!" : msg}</span>
    </button>
  );
}

const PIECES: Record<string, string> = {
  wk: "♔", wq: "♕", wr: "♖", wb: "♗", wn: "♘", wp: "♙",
  bk: "♚", bq: "♛", br: "♜", bb: "♝", bn: "♞", bp: "♟",
};

const PUZZLES = [
  {
    title: "Mate in one",
    instruction: "White to move. Find the move that checkmates the black king.",
    fen: "7k/8/5KQ1/8/8/8/8/8 w - - 0 1",
    success: (chess: Chess) => chess.isCheckmate(),
    successText: "Checkmate. You found the winning move.",
  },
  {
    title: "Save your king",
    instruction: "Black is in check. Find a legal move that gets the king out of check.",
    fen: "7k/8/5K2/8/8/8/8/7R b - - 0 1",
    success: (chess: Chess) => !chess.isCheck() && chess.turn() === "w",
    successText: "The king escaped check.",
  },
];

function ChessPuzzles({ onDone }: { onDone: Done }) {
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [chess, setChess] = useState(() => new Chess(PUZZLES[0].fen));
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [finished, setFinished] = useState(false);
  const puzzle = PUZZLES[puzzleIndex];

  const tapSquare = (square: string) => {
    if (finished) return;
    const piece = chess.get(square as never);
    if (!selected) {
      if (piece && piece.color === chess.turn()) setSelected(square);
      return;
    }
    if (selected === square) { setSelected(null); return; }
    if (piece && piece.color === chess.turn()) { setSelected(square); return; }
    const next = new Chess(chess.fen());
    try {
      next.move({ from: selected, to: square, promotion: "q" });
    } catch {
      setMessage("That move is not legal. Try another square.");
      setSelected(null);
      return;
    }
    setSelected(null);
    if (puzzle.success(next)) {
      setChess(next);
      setMessage(puzzle.successText);
      setFinished(true);
      return;
    }
    setMessage("Not quite. Try the puzzle again.");
    setChess(new Chess(puzzle.fen));
  };

  const reset = () => {
    setChess(new Chess(puzzle.fen));
    setSelected(null);
    setMessage("");
    setFinished(false);
  };

  const nextPuzzle = () => {
    if (puzzleIndex === 0) {
      setPuzzleIndex(1);
      setChess(new Chess(PUZZLES[1].fen));
      setSelected(null);
      setMessage("");
      setFinished(false);
    } else {
      onDone(1);
    }
  };

  return (
    <div className="space-y-4 py-2">
      <div>
        <div className="text-sm font-semibold text-primary">Puzzle {puzzleIndex + 1} / 2</div>
        <p className="mt-1 text-sm text-muted-foreground">{puzzle.instruction}</p>
      </div>
      <div className="mx-auto grid aspect-square w-full max-w-[340px] grid-cols-8 overflow-hidden rounded-xl border">
        {chess.board().flatMap((row, rank) => row.map((piece, file) => {
          const square = `${"abcdefgh"[file]}${8 - rank}`;
          const dark = (rank + file) % 2 === 1;
          const chosen = selected === square;
          const symbol = piece ? PIECES[`${piece.color}${piece.type}`] : "";
          return (
            <button
              key={square}
              onClick={() => tapSquare(square)}
              aria-label={square}
              className={`grid aspect-square place-items-center text-[clamp(1.6rem,8vw,2.7rem)] leading-none ${dark ? "bg-[#769656]" : "bg-[#eeeed2]"} ${chosen ? "ring-4 ring-inset ring-yellow-400" : ""}`}
            >
              <span className={piece?.color === "b" ? "text-[#202020]" : "text-white [text-shadow:0_1px_3px_#333]"}>{symbol}</span>
            </button>
          );
        }))}
      </div>
      {message && <p className={`text-center text-sm ${finished ? "text-primary" : "text-muted-foreground"}`}>{message}</p>}
      <div className="flex gap-2">
        <Button variant="secondary" className="h-12 flex-1" onClick={reset}>Restart</Button>
        {finished && <Button className="h-12 flex-1" onClick={nextPuzzle}>{puzzleIndex === 0 ? "Next puzzle" : "Finish"}</Button>}
      </div>
      <p className="text-center text-xs text-muted-foreground">Tap a piece, then tap its destination square.</p>
    </div>
  );
}

const Placeholder = ({ onDone }: { onDone: Done }) => (
  <div className="space-y-4 py-6 text-center">
    <p className="text-muted-foreground">This mini-game is not built yet. You can log a basic practice session for now.</p>
    <Button className="h-12" onClick={() => onDone(0.4)}>Basic practice</Button>
  </div>
);

export function Minigame({ prof, onDone }: { prof: ProfessionId; onDone: Done }) {
  if (prof === "footballer") return <Football onDone={onDone} />;
  if (prof === "cowboy") return <Duel onDone={onDone} />;
  if (prof === "chess") return <ChessPuzzles onDone={onDone} />;
  return <Placeholder onDone={onDone} />;
}
