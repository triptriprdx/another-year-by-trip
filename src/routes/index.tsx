import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GAME_NAME } from "@/game/config";
import { loadSave, useGame, useLoaded } from "@/game/store";
import { MainMenu } from "@/components/game/MainMenu";
import { NewLife } from "@/components/game/NewLife";
import { GameScreen } from "@/components/game/GameScreen";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${GAME_NAME} — live a life, one year at a time` },
      { name: "description", content: "A mobile-first text life simulator. Pick a path and make yearly choices." },
      { property: "og:title", content: GAME_NAME },
      { property: "og:description", content: "A mobile-first text life simulator." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const loaded = useLoaded();
  const game = useGame();
  const [screen, setScreen] = useState<"menu" | "new" | "game">("menu");
  useEffect(() => loadSave(), []);
  if (!loaded) return <div className="min-h-dvh bg-background" />;
  if (screen === "new") return <NewLife onBack={() => setScreen("menu")} onDone={() => setScreen("game")} />;
  if (screen === "game" && game) return <GameScreen g={game} onMenu={() => setScreen("menu")} />;
  return <MainMenu onNew={() => setScreen("new")} onContinue={() => setScreen("game")} />;
}