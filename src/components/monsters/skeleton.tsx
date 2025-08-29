"use client";

import { useGLTF } from "@react-three/drei";
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  COLLISION_RADIUS,
  HIT_BOUNCE_BACK,
  HIT_BOUNCE_PAUSE,
  BOUNCE_RETREAT_SPEED_MULTIPLIER,
  SKELETON_SPEED,
} from "@/config/gameplay";
import { useGame } from "@/store/game";

type SkeletonProps = {
  position?: [number, number, number];
  speed?: number; // units per second
  name?: string;
};

const Skeleton = ({ position = [-5, 0, 5], speed = SKELETON_SPEED, name = "skeleton" }: SkeletonProps) => {
  const group = useRef<THREE.Group>(null!);
  const gltf = useGLTF("/assets/character-skeleton.glb");
  const model = useMemo(() => SkeletonUtils.clone(gltf.scene) as THREE.Group, [gltf.scene]);
  const { scene } = useThree();

  // Cache helpers
  const tmpP = useMemo(() => new THREE.Vector3(), []); // player position
  const tmpV = useMemo(() => new THREE.Vector3(), []); // general vector
  const playerRef = useRef<THREE.Object3D | null>(null);
  const gameGet = useRef(useGame.getState).current;
  const retreatTimer = useRef(0); // seconds remaining to retreat
  const retreatDir = useRef(new THREE.Vector3()); // direction to move while retreating (backwards)

  useEffect(() => {
    if (!model) return;
    model.scale.set(1, 1, 1);
    model.traverse((child: any) => {
      child.castShadow = true;
      child.receiveShadow = true;
    });
  }, [model]);

  useFrame((_, delta) => {
    if (gameGet().paused) return;
    // Track player
    if (!playerRef.current) {
      playerRef.current = scene.getObjectByName("player") || null;
    }
    if (!playerRef.current || !group.current) return;

    // Seek player on XZ plane
    const p = playerRef.current.getWorldPosition(tmpP.set(0, 0, 0));
    const g = group.current.position;
    const toPlayer = tmpV.set(p.x - g.x, 0, p.z - g.z);
    const dist = toPlayer.length();

    const R = gameGet().hitRadius || COLLISION_RADIUS;

    // If retreating, move backwards for a short duration
    if (retreatTimer.current > 0) {
      const retreatSpeed = speed * BOUNCE_RETREAT_SPEED_MULTIPLIER;
      const step = retreatSpeed * delta;
      g.addScaledVector(retreatDir.current, step);
      retreatTimer.current = Math.max(0, retreatTimer.current - delta);
      // keep grounded
      group.current.position.y = 0;
      return;
    }

    // If already inside the hit-range, push just outside and start retreat
    if (dist > 0 && dist < R) {
      const away = g.clone().sub(p).setY(0);
      if (away.lengthSq() < 1e-6) away.set(1, 0, 0);
      away.normalize();
      // push to just outside the ring, then back off for a moment
      g.copy(p.clone().addScaledVector(away, R + HIT_BOUNCE_BACK));
      retreatDir.current.copy(away); // backwards relative to the approach
      retreatTimer.current = HIT_BOUNCE_PAUSE;
      // Deal contact damage to player
      try {
        gameGet().damage?.(1);
      } catch {}
      group.current.position.y = 0;
      return;
    }

    if (dist > 1e-4) {
      // Try to move towards player
      const dir = toPlayer.clone().normalize();
      const step = speed * delta;
      const candidate = g.clone().addScaledVector(dir, step);
      const candToPlayer = p.clone().sub(candidate).setY(0);
      const candDist = candToPlayer.length();

      if (candDist < R) {
        // Push just outside the border and start retreating backwards
        const outward = candidate.clone().sub(p).setY(0);
        if (outward.lengthSq() < 1e-6) outward.set(1, 0, 0);
        outward.normalize();
        const newPos = p.clone().addScaledVector(outward, R + HIT_BOUNCE_BACK);
        g.copy(newPos);
        retreatDir.current.copy(outward);
        retreatTimer.current = HIT_BOUNCE_PAUSE;
        // Deal contact damage to player
        try {
          gameGet().damage?.(1);
        } catch {}
      } else {
        g.copy(candidate);
      }

      // face towards player only when not retreating
      const yaw = Math.atan2(dir.x, dir.z);
      group.current.rotation.y = yaw;
    }
    // Keep grounded
    group.current.position.y = 0;
  });

  return (
    <group ref={group} position={position} name={name}>
      <primitive object={model} />
    </group>
  );
};

useGLTF.preload("/assets/character-skeleton.glb");

export default Skeleton;

