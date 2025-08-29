"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { BULLET_RANGE } from "@/config/gameplay";

const ShootRange = () => {
  // Only show in development environment
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const { scene } = useThree();
  const ringRef = useRef<THREE.Mesh>(null!);
  const playerRef = useRef<THREE.Object3D | null>(null);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (!playerRef.current) {
      playerRef.current = scene.getObjectByName("player") || null;
      if (!playerRef.current) return;
    }
    const p = playerRef.current.getWorldPosition(tmp.set(0, 0, 0));
    ringRef.current.position.set(p.x, 0.01, p.z);
  });

  const r = BULLET_RANGE;
  return (
    <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1000}>
      <ringGeometry args={[r - 0.06, r + 0.06, 64]} />
      <meshBasicMaterial color="#ffcc00" transparent opacity={0.85} />
    </mesh>
  );
};

export default ShootRange;
