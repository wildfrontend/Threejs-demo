'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

import { BULLET_RANGE } from '@/config/gameplay';

const ShootRange = () => {
  const { scene } = useThree();
  const ringRef = useRef<THREE.Mesh>(null!);
  const playerRef = useRef<THREE.Object3D | null>(null);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (!playerRef.current) {
      playerRef.current = scene.getObjectByName('player') || null;
      if (!playerRef.current) return;
    }
    const p = playerRef.current.getWorldPosition(tmp.set(0, 0, 0));
    ringRef.current.position.set(p.x, 0.01, p.z);
  });

  const r = BULLET_RANGE;
  return (
    <mesh ref={ringRef} renderOrder={1000} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[r - 0.06, r + 0.06, 64]} />
      <meshBasicMaterial color="#ffcc00" opacity={0.85} transparent />
    </mesh>
  );
};

export default ShootRange;
