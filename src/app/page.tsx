'use client';

import AmmoHUD from '@/components/hud/ammo';
import GameOverHUD from '@/components/hud/gameover';
import HealthHUD from '@/components/hud/health';
import KillsHUD from '@/components/hud/kills';
import LevelUpHUD from '@/components/hud/levelup';
import PauseHUD from '@/components/hud/pause';
import XPHUD from '@/components/hud/xp';
import Sandbox from '@/components/sandbox';
import { useGame } from '@/store/game';

function Page() {
  const runId = useGame((s) => s.runId);
  return (
    <div className="relative w-full h-dvh">
      <Sandbox key={runId} />
      <HealthHUD />
      <AmmoHUD />
      <KillsHUD />
      <PauseHUD />
      <XPHUD />
      <LevelUpHUD />
      <GameOverHUD />
    </div>
  );
}

export default Page;
