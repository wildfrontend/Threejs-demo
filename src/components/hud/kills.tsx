"use client";

import { useGame } from "@/store/game";

const KillsHUD = () => {
  const kills = useGame((s) => s.kills);

  return (
    <div className="pointer-events-none absolute top-4 left-4">
      <div className="flex items-center gap-2 rounded-md bg-black/20 px-3 py-1.5">
        <span className="text-xs text-gray-200/80">Kills</span>
        <span className="text-green-300 font-mono tabular-nums">{kills}</span>
      </div>
    </div>
  );
};

export default KillsHUD;


