import Sandbox from '@/components/sandbox';
import HealthHUD from '@/components/hud/health';

function Page() {
  return (
    <div className="relative w-full h-dvh">
      <Sandbox />
      <HealthHUD />
    </div>
  );
}

export default Page;
