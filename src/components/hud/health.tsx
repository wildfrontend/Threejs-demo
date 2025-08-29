'use client';

import { useMemo } from 'react';

import { useGame } from '@/store/game';

function Heart({ filled }: { filled: boolean }) {
  // Use consistent glyphs for filled/empty hearts for visual clarity
  return (
    <span
      aria-hidden
      className={
        'text-2xl leading-none drop-shadow-sm ' +
        (filled ? 'text-red-500' : 'text-gray-300 opacity-70')
      }
    >
      {filled ? '\u2665' : '\u2661'}
    </span>
  );
}

const HealthHUD = () => {
  const health = useGame((s) => s.health);
  const maxHealth = useGame((s) => s.maxHealth);

  const hearts = useMemo(() => Array.from({ length: maxHealth }), [maxHealth]);

  return (
    <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-md bg-black/20 px-3 py-1.5">
        {hearts.map((_, i) => (
          <Heart filled={i < health} key={i} />
        ))}
      </div>
    </div>
  );
};

export default HealthHUD;
