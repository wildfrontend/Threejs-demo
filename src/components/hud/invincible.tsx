'use client';

import { useGame } from '@/store/game';

const InvincibleHUD = () => {
  const inv = useGame((s) => s.invincible);
  const left = useGame((s) => s.invincibleFor);
  const cd = useGame((s) => s.invincibleCooldown);
  const upg = useGame((s) => s.moveSpeedUpgrades);

  const unlocked = (upg ?? 0) + 1 >= 5;
  if (!unlocked) return null;

  const isActive = inv && left > 0;
  const isCd = !isActive && cd > 0;
  const label = isActive
    ? `Invincible ${left.toFixed(1)}s`
    : isCd
      ? `Cooldown ${Math.ceil(cd)}s`
      : 'Ready (Space)';
  const pct = isActive
    ? Math.max(0, Math.min(1, left / 2))
    : isCd
      ? Math.max(0, Math.min(1, 1 - cd / 30))
      : 1;

  return (
    <div className="pointer-events-none absolute bottom-4 right-4">
      <div className="rounded-md bg-black/20 px-3 py-1.5">
        <div className="text-xs text-white/80 mb-1">Invincibility</div>
        <div className="w-40 h-1.5 rounded bg-white/10 overflow-hidden">
          <div
            className="h-full bg-cyan-400"
            style={{ width: `${(pct * 100).toFixed(0)}%` }}
          />
        </div>
        <div className="mt-1 text-[11px] text-white/80 font-mono">{label}</div>
      </div>
    </div>
  );
};

export default InvincibleHUD;
