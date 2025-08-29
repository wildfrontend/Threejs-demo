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
        count={skeletonCount}
        kind="skeleton"
        respawnDelay={1.5}
        spawnMax={20}
        spawnMin={10}
      />
      <GenericSpawner
        count={ghostCount}
        kind="ghost"
        respawnDelay={2.5}
        spawnMax={22}
        spawnMin={12}
      />
      <GenericSpawner
        count={zombieCount}
        kind="zombie"
        respawnDelay={3.5}
        spawnMax={24}
        spawnMin={14}
      />
      <GenericSpawner
        count={vampireCount}
        kind="vampire"
        respawnDelay={10}
        spawnMax={26}
        spawnMin={18}
      />
    </group>
  );
};

export default Director;
