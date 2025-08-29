"use client";

import { useEffect } from "react";
import { useGame } from "@/store/game";

const PauseHUD = () => {
  const paused = useGame((s) => s.paused);
  const gameOver = useGame((s) => s.gameOver);
  const togglePaused = useGame((s) => s.togglePaused);
  const setPaused = useGame((s) => s.setPaused);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key.toLowerCase() === "p") {
        e.preventDefault();
        togglePaused();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePaused]);

  return (
    <div className="pointer-events-none absolute bottom-4 left-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 rounded-md bg-black/20 px-3 py-1.5">
        <span className="text-xs text-gray-200/80">Game</span>
        <span className={"text-sm font-mono " + (gameOver ? "text-red-400" : paused ? "text-red-300" : "text-lime-300")}>{gameOver ? "Game Over" : paused ? "Paused" : "Running"}</span>
      </div>
      <button
        className="pointer-events-auto rounded-md bg-white/10 hover:bg-white/20 px-3 py-1 text-xs text-white"
        onClick={() => !gameOver && setPaused(!paused)}
        disabled={gameOver}
      >
        {gameOver ? "Restart from overlay" : paused ? "Resume (Esc/P)" : "Pause (Esc/P)"}
      </button>
    </div>
  );
};

export default PauseHUD;
