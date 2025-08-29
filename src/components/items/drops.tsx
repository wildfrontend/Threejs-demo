'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

import { HEART_PICKUP_RADIUS } from '@/config/gameplay';
import { useGame } from '@/store/game';

const Drops = () => {
  const drops = useGame((s) => s.drops);
  const removeDrop = useGame((s) => s.removeDrop);
  const heal = useGame((s) => s.heal);
  const { scene } = useThree();
  const playerRef = useRef<THREE.Object3D | null>(null);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (!playerRef.current)
      playerRef.current = scene.getObjectByName('player') || null;
    if (!playerRef.current) return;
    const p = playerRef.current.getWorldPosition(tmp.set(0, 0, 0));
    // Check pickups
    for (const d of drops) {
      const dx = p.x - d.position[0];
      const dz = p.z - d.position[2];
      const dist = Math.hypot(dx, dz);
      if (dist <= HEART_PICKUP_RADIUS) {
        heal(1);
        removeDrop(d.id);
      }
    }
  });

  return (
    <group>
      {drops.map((d) => (
        <mesh
          key={d.id}
          position={[d.position[0], 0.5, d.position[2]]}
          renderOrder={1000}
        >
          <sphereGeometry args={[0.15, 10, 10]} />
          <meshBasicMaterial color="#ff4d7d" toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
};

export default Drops;
