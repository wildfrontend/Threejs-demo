import Sandbox from '@/components/sandbox';
import HealthHUD from '@/components/hud/health';
import AmmoHUD from '@/components/hud/ammo';
import KillsHUD from '@/components/hud/kills';
import PauseHUD from '@/components/hud/pause';
import XPHUD from '@/components/hud/xp';
import LevelUpHUD from '@/components/hud/levelup';

function Page() {
  return (
    <div className="relative w-full h-dvh">
      <Sandbox />
      <HealthHUD />
      <AmmoHUD />
      <KillsHUD />
      <PauseHUD />
      <XPHUD />
      <LevelUpHUD />
    </div>
  );
}

export default Page;
