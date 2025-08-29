"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { COLLISION_RADIUS } from "@/config/gameplay";

const CollisionRange = ({ radius = COLLISION_RADIUS }: { radius?: number }) => {
  const { scene } = useThree();
  const ringRef = useRef<THREE.Mesh>(null!);
  const playerRef = useRef<THREE.Object3D | null>(null);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const [computedRadius, setComputedRadius] = useState<number | null>(null);
  const hasComputedRef = useRef(false);

  useFrame(() => {
    if (!playerRef.current) {
      playerRef.current = scene.getObjectByName("player") || null;
      if (!playerRef.current) return;
    }

    // Compute a tight radius from player's bounding volume once
    if (!hasComputedRef.current && playerRef.current) {
      const box = new THREE.Box3().setFromObject(playerRef.current);
      const sphere = new THREE.Sphere();
      box.getBoundingSphere(sphere);
      const tight = Math.max(0.3, sphere.radius * 0.5);
      setComputedRadius(tight);
      hasComputedRef.current = true;
    }
    const p = playerRef.current.getWorldPosition(tmp.set(0, 0, 0));
    ringRef.current.position.set(p.x, 0.01, p.z);
  });

  // Thin ring aligned to ground
  const r = computedRadius ?? radius;
  return (
    <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} renderOrder={999}>
      <ringGeometry args={[r - 0.06, r + 0.06, 64]} />
      <meshBasicMaterial color="#44e0ff" transparent opacity={0.9} />
    </mesh>
  );
};

export default CollisionRange;
