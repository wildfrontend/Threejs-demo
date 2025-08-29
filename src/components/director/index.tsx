'use client';

import GenericSpawner from '@/components/spawner/generic';
import { useGame } from '@/store/game';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

const Director = () => {
  const kills = useGame((s) => s.kills);

  // While paused/gameover, keep previous targets implicitly via render, spawners halt via their own checks
  const k = kills;

  const skeletonCount = clamp(5 + Math.floor(k / 2), 5, 30);
  const ghostCount = k >= 10 ? clamp(Math.floor((k - 8) / 5), 0, 12) : 0;
  const zombieCount = k >= 25 ? clamp(Math.floor((k - 20) / 7), 0, 8) : 0;
  const vampireCount = k >= 60 ? 1 : 0;

  return (
    <group>
      <GenericSpawner
        kind="skeleton"
        count={skeletonCount}
        spawnMin={10}
        spawnMax={20}
        respawnDelay={1.5}
      />
      <GenericSpawner
        kind="ghost"
        count={ghostCount}
        spawnMin={12}
        spawnMax={22}
        respawnDelay={2.5}
      />
      <GenericSpawner
        kind="zombie"
        count={zombieCount}
        spawnMin={14}
        spawnMax={24}
        respawnDelay={3.5}
      />
      <GenericSpawner
        kind="vampire"
        count={vampireCount}
        spawnMin={18}
        spawnMax={26}
        respawnDelay={10}
      />
    </group>
  );
};

export default Director;
