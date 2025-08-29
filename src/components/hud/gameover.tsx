"use client";

import { useGame } from "@/store/game";

const GameOverHUD = () => {
  const gameOver = useGame((s) => s.gameOver);
  const resetGame = useGame((s) => s.resetGame);

  if (!gameOver) return null;

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/60">
      <div className="pointer-events-auto w-[520px] max-w-[90vw] rounded-lg bg-zinc-900/95 p-6 shadow-2xl border border-white/10 text-center">
        <div className="text-3xl font-extrabold tracking-wide text-red-300 drop-shadow mb-2">
          GAME OVER
        </div>
        <div className="text-sm text-white/80 mb-4">你已經倒下了，想再來一局嗎？</div>
        <button
          onClick={() => resetGame()}
          className="rounded-md bg-white/10 hover:bg-white/20 px-4 py-2 text-white text-sm"
        >
          Restart
        </button>
      </div>
    </div>
  );
};

export default GameOverHUD;

