"use client";

import { useGame } from "@/store/game";

const AmmoHUD = () => {
  const ammo = useGame((s) => s.ammo);
  const cap = useGame((s) => s.ammoCapacity);
  const reloading = useGame((s) => s.reloading);

  return (
    <div className="pointer-events-none absolute top-4 right-4">
      <div className="flex items-center gap-2 rounded-md bg-black/20 px-3 py-1.5">
        <span className="text-xs text-gray-200/80">Ammo</span>
        <span className="text-yellow-300 font-mono tabular-nums">
          {ammo} / {cap}
        </span>
        {reloading && (
          <span className="text-xs text-orange-300">Reloading…</span>
        )}
      </div>
    </div>
  );
};

export default AmmoHUD;
