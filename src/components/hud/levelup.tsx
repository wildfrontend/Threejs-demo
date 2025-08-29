'use client';

import { useEffect, useState } from 'react';

import {
  BASE_AMMO_CAPACITY,
  BASE_MAX_HEALTH,
  MOVE_SPEED_BASE,
} from '@/config/gameplay';
import { useGame } from '@/store/game';

type Upgrade = {
  key:
    | 'maxHealth'
    | 'bulletDamage'
    | 'bulletCount'
    | 'moveSpeed'
    | 'ammoCapacity';
  title: string;
  desc: string;
};

const ALL_UPGRADES: Upgrade[] = [
  {
    key: 'maxHealth',
    title: '增加一顆心',
    desc: '最大生命值 +1（LV5：上限×2，並回滿）',
  },
  {
    key: 'bulletDamage',
    title: '子彈更痛',
    desc: '子彈傷害 +1（LV5：子彈可穿透）',
  },
  {
    key: 'bulletCount',
    title: '散彈更多',
    desc: '每次多發 1 顆，扇形擴散（LV5：360° 射擊）',
  },
  {
    key: 'moveSpeed',
    title: '移動更快',
    desc: '移動速度 +10%（LV5：空白鍵無敵2s，冷卻30s，面板顯示）',
  },
  {
    key: 'ammoCapacity',
    title: '更多彈藥',
    desc: '彈藥容量 +1（並回滿；LV5：無限彈藥）',
  },
];

function sampleUnique<T>(arr: T[], n: number) {
  const out: T[] = [];
  const used = new Set<number>();
  const max = Math.min(n, arr.length);
  while (out.length < max) {
    const i = Math.floor(Math.random() * arr.length);
    if (!used.has(i)) {
      used.add(i);
      out.push(arr[i]);
    }
  }
  return out;
}

const LevelUpHUD = () => {
  const paused = useGame((s) => s.paused);
  const gameOver = useGame((s) => s.gameOver);
  const upgradePending = useGame((s) => s.upgradePending);
  const applyUpgrade = useGame((s) => s.applyUpgrade);
  const level = useGame((s) => s.level);
  const maxHealth = useGame((s) => s.maxHealth);
  const bulletDamage = useGame((s) => s.bulletDamage);
  const bulletCount = useGame((s) => s.bulletCount);
  const moveSpeed = useGame((s) => s.moveSpeed);
  const moveSpeedUpgrades = useGame((s) => s.moveSpeedUpgrades);
  const ammoCapacity = useGame((s) => s.ammoCapacity);

  const [choices, setChoices] = useState<Upgrade[]>([]);

  // When there's pending upgrades, roll 3 random choices (filter out maxed LV5)
  useEffect(() => {
    if (upgradePending > 0) {
      const getLv = (key: Upgrade['key']) =>
        key === 'maxHealth'
          ? Math.max(1, maxHealth - BASE_MAX_HEALTH + 1)
          : key === 'bulletDamage'
            ? Math.max(1, bulletDamage)
            : key === 'bulletCount'
              ? Math.max(1, bulletCount)
              : key === 'ammoCapacity'
                ? Math.max(1, ammoCapacity - BASE_AMMO_CAPACITY + 1)
                : Math.max(1, (moveSpeedUpgrades ?? 0) + 1);
      const available = ALL_UPGRADES.filter((u) => getLv(u.key) < 5);
      setChoices(sampleUnique(available.length ? available : ALL_UPGRADES, 3));
    } else {
      setChoices([]);
    }
  }, [
    upgradePending,
    level,
    maxHealth,
    bulletDamage,
    bulletCount,
    ammoCapacity,
    moveSpeedUpgrades,
  ]);

  if (!paused || gameOver || upgradePending <= 0) return null;

  const onPick = (u: Upgrade) => {
    applyUpgrade(u.key);
    // After applying, if still more pending, reroll next set
    setTimeout(() => {
      if (useGame.getState().upgradePending > 0) {
        const s = useGame.getState();
        const getLv = (key: Upgrade['key']) =>
          key === 'maxHealth'
            ? Math.max(1, s.maxHealth - BASE_MAX_HEALTH + 1)
            : key === 'bulletDamage'
              ? Math.max(1, s.bulletDamage)
              : key === 'bulletCount'
                ? Math.max(1, s.bulletCount)
                : key === 'ammoCapacity'
                  ? Math.max(1, s.ammoCapacity - BASE_AMMO_CAPACITY + 1)
                  : Math.max(1, (s.moveSpeedUpgrades ?? 0) + 1);
        const available = ALL_UPGRADES.filter((x) => getLv(x.key) < 5);
        setChoices(
          sampleUnique(available.length ? available : ALL_UPGRADES, 3)
        );
      }
    }, 0);
  };

  // Build "already chosen" list (only show items with Lv >= 2)
  const getLv = (key: Upgrade['key']) =>
    key === 'maxHealth'
      ? Math.max(1, maxHealth - BASE_MAX_HEALTH + 1)
      : key === 'bulletDamage'
        ? Math.max(1, bulletDamage)
        : key === 'bulletCount'
          ? Math.max(1, bulletCount)
          : key === 'ammoCapacity'
            ? Math.max(1, ammoCapacity - BASE_AMMO_CAPACITY + 1)
            : Math.max(1, (moveSpeedUpgrades ?? 0) + 1);

  const picked = ((): { title: string; lv: number }[] => {
    return ALL_UPGRADES.map((u) => ({
      title: u.title,
      lv: getLv(u.key),
    })).filter((x) => x.lv >= 2);
  })();

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40">
      <div className="pointer-events-auto w-[560px] max-w-[92vw] rounded-lg bg-zinc-900/90 p-5 shadow-xl border border-white/10">
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="text-lg font-semibold text-white">
            升級！選擇一項強化
          </h3>
          <span className="text-xs text-white/60">Lv {level}</span>
        </div>
        <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-md bg-white/5 px-3 py-2 flex items-center justify-between">
            <span className="text-white/80">心數</span>
            <span className="text-white font-mono">{maxHealth}</span>
          </div>
          <div className="rounded-md bg-white/5 px-3 py-2 flex items-center justify-between">
            <span className="text-white/80">傷害</span>
            <span className="text-white font-mono">{bulletDamage}</span>
          </div>
          <div className="rounded-md bg-white/5 px-3 py-2 flex items-center justify-between">
            <span className="text-white/80">散彈數</span>
            <span className="text-white font-mono">{bulletCount}</span>
          </div>
          <div className="rounded-md bg-white/5 px-3 py-2 flex items-center justify-between">
            <span className="text-white/80">移動速度</span>
            <span className="text-white font-mono">
              {moveSpeed.toFixed(2)}
              <span className="text-white/60 ml-1">
                ({((moveSpeed / MOVE_SPEED_BASE - 1) * 100).toFixed(0)}%)
              </span>
            </span>
          </div>
          <div className="rounded-md bg-white/5 px-3 py-2 flex items-center justify-between">
            <span className="text-white/80">彈藥容量</span>
            <span className="text-white font-mono">{ammoCapacity}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {choices.map((c) => {
            const lv =
              c.key === 'maxHealth'
                ? Math.max(1, maxHealth - BASE_MAX_HEALTH + 1)
                : c.key === 'bulletDamage'
                  ? Math.max(1, bulletDamage)
                  : c.key === 'bulletCount'
                    ? Math.max(1, bulletCount)
                    : c.key === 'ammoCapacity'
                      ? Math.max(1, ammoCapacity - BASE_AMMO_CAPACITY + 1)
                      : Math.max(1, (moveSpeedUpgrades ?? 0) + 1);
            return (
              <button
                className="rounded-md border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-3 text-left"
                key={c.key}
                onClick={() => onPick(c)}
              >
                <div className="flex items-center justify-between">
                  <div className="text-white font-medium">{c.title}</div>
                  <div className="text-[11px] text-white/80">Lv {lv}</div>
                </div>
                <div className="text-sm text-white/70">{c.desc}</div>
              </button>
            );
          })}
        </div>
        {picked.length > 0 && (
          <div className="mt-3">
            <div className="text-xs text-white/80 mb-1">已選強化</div>
            <div className="flex flex-wrap gap-2">
              {picked.map((p) => (
                <span
                  className="rounded bg-white/10 px-2 py-1 text-[11px] text-white/90"
                  key={p.title}
                >
                  {p.title} · Lv {p.lv}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LevelUpHUD;
