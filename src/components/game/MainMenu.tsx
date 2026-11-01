import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { GAME_NAME, getProfession } from "@/game/config";
import { setGame, setSettings, useGame, useSettings } from "@/game/store";

export function MainMenu({ onNew, onContinue }: { onNew: () => void; onContinue: () => void }) {
  const game = useGame();
  const settings = useSettings();
  const [showSettings, setShowSettings] = useState(false);
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="hero-bg flex min-h-dvh flex-col px-6 safe-top safe-bottom">
      <div className="flex flex-1 flex-col justify-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">A life, one year at a time</p>
        <h1 className="mt-3 text-6xl font-extrabold leading-none">{GAME_NAME}</h1>
        <p className="mt-4 max-w-xs text-muted-foreground">Pick a path. Make choices. See who you become.</p>
      </div>

      <div className="flex flex-col gap-3 pb-6">
        {game && (
          <Button size="lg" className="h-16 justify-between rounded-2xl px-5 text-base glow" onClick={onContinue}>
            <span>Continue</span>
            <span className="text-sm font-medium opacity-80">
              {game.char.firstName}, {game.age} · {getProfession(game.career.profession).name}
            </span>
          </Button>
        )}
        <Button size="lg" variant={game ? "secondary" : "default"} className="h-16 rounded-2xl text-base" onClick={() => (game ? setConfirm(true) : onNew())}>
          New Life
        </Button>
        <Button size="lg" variant="ghost" className="h-14 rounded-2xl text-base text-muted-foreground" onClick={() => setShowSettings((v) => !v)}>
          Settings
        </Button>
        {showSettings && (
          <div className="rounded-2xl border bg-card p-4">
            <label className="flex items-center justify-between py-2">
              <span>Sound effects</span>
              <Switch checked={settings.sound} onCheckedChange={(v) => setSettings({ ...settings, sound: v })} />
            </label>
            {game && (
              <Button variant="outline" className="mt-2 h-12 w-full text-destructive" onClick={() => setConfirm(true)}>
                Delete current save
              </Button>
            )}
          </div>
        )}
      </div>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent className="max-w-[92vw] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Start over?</AlertDialogTitle>
            <AlertDialogDescription>This erases {game?.char.firstName}'s life. It can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep playing</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => { setGame(null); onNew(); }}>
              Erase & start new
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}