"use client";

import { useGame } from "@/store/game";
import { MAX_LEVEL } from "@/config/gameplay";

const XPHUD = () => {
  const level = useGame((s) => s.level);
  const xp = useGame((s) => s.xp);
  const xpToNext = useGame((s) => s.xpToNext);

  const isMax = level >= MAX_LEVEL || xpToNext === 0;
  const pct = isMax ? 1 : Math.max(0, Math.min(1, xpToNext > 0 ? xp / xpToNext : 0));

  return (
    <div className="pointer-events-none absolute top-4 left-24">
      <div className="flex items-center gap-3 rounded-md bg-black/20 px-3 py-1.5">
        <span className="text-xs text-gray-200/80">Lv</span>
        <span className="text-blue-300 font-mono tabular-nums">{level}</span>
        <div className="w-28 h-1.5 rounded bg-white/10 overflow-hidden">
          <div
            className="h-full bg-blue-400"
            style={{ width: `${(pct * 100).toFixed(1)}%` }}
          />
        </div>
        <span className="text-[10px] text-gray-300/70 font-mono">
          {isMax ? "MAX" : `${xp}/${xpToNext}`}
        </span>
      </div>
    </div>
  );
};

export default XPHUD;
