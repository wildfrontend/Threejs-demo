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
  GHOST_SPEED,
  GHOST_ATTACK,
  GHOST_HP,
  GHOST_ATTACK_RANGE,
  MONSTER_ATTACK_COOLDOWN,
  BULLET_SPEED,
  BULLET_SIZE,
} from "@/config/gameplay";
import { useGame } from "@/store/game";

type GhostProps = {
  position?: [number, number, number];
  speed?: number; // units per second
  name?: string;
};

const Ghost = ({ position = [8, 0, 8], speed = GHOST_SPEED, name = "ghost" }: GhostProps) => {
  const group = useRef<THREE.Group>(null!);
  const gltf = useGLTF("/assets/character-ghost.glb");
  const model = useMemo(() => SkeletonUtils.clone(gltf.scene) as THREE.Group, [gltf.scene]);
  const { scene } = useThree();

  // Cache helpers
  const tmpP = useMemo(() => new THREE.Vector3(), []); // player position
  const tmpV = useMemo(() => new THREE.Vector3(), []); // general vector
  const playerRef = useRef<THREE.Object3D | null>(null);
  const gameGet = useRef(useGame.getState).current;
  const retreatTimer = useRef(0); // seconds remaining to retreat
  const retreatDir = useRef(new THREE.Vector3()); // direction to move while retreating (backwards)
  const atkTimer = useRef(0);
  const bulletsRef = useRef<{ position: THREE.Vector3; direction: THREE.Vector3; traveled: number }[]>([]);
  const imRef = useRef<THREE.InstancedMesh>(null!);
  const tmpObj = useMemo(() => new THREE.Object3D(), []);
  const muzzleHelperRef = useRef<THREE.Mesh>(null!);

  useEffect(() => {
    if (!model) return;
    model.scale.set(1, 1, 1);
    model.traverse((child: any) => {
      child.castShadow = true;
      child.receiveShadow = true;
    });
    if (group.current) {
      const g: any = group.current;
      g.userData = { ...(g.userData || {}), hp: GHOST_HP, maxHp: GHOST_HP };
    }
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
    const attackR = GHOST_ATTACK_RANGE;
    const holdEps = 0.2;

    // Timers
    if (atkTimer.current > 0) atkTimer.current = Math.max(0, atkTimer.current - delta);

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

    // Compute ghost model center as the muzzle start
    let start = g.clone();
    try {
      const box = new THREE.Box3().setFromObject(group.current);
      start = box.getCenter(new THREE.Vector3());
    } catch {}
    const isDev = process.env.NODE_ENV !== 'production';
    if (muzzleHelperRef.current) {
      if (isDev) {
        const local = start.clone();
        // convert world center to group's local space so marker stays attached on ghost
        try { group.current.worldToLocal(local); } catch {}
        muzzleHelperRef.current.position.copy(local);
        muzzleHelperRef.current.visible = true;
      } else {
        muzzleHelperRef.current.visible = false;
      }
    }

    // Ranged attack when within attack range (do not fire when overlapping collision radius)
    if (dist > R && dist <= attackR && atkTimer.current <= 0) {
      // Spawn a ghost bullet toward the player from center
      const target = p.clone();
      const dirCenter = target.clone().sub(start).setY(0).normalize();
      bulletsRef.current.push({ position: start.clone(), direction: dirCenter, traveled: 0 });
      atkTimer.current = MONSTER_ATTACK_COOLDOWN;
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
      // Deal contact damage to player and throttle ranged cooldown
      try {
        gameGet().damage?.(GHOST_ATTACK);
      } catch {}
      atkTimer.current = Math.max(atkTimer.current, MONSTER_ATTACK_COOLDOWN);
      group.current.position.y = 0;
      return;
    }

    // Maintain distance: move toward if too far, move away if too close, else hold
    if (dist > 1e-4) {
      const dirToPlayer = toPlayer.clone().normalize();
      const step = speed * delta;
      let moved = false;
      if (dist > attackR + holdEps) {
        // too far, approach
        const candidate = g.clone().addScaledVector(dirToPlayer, step);
        g.copy(candidate);
        moved = true;
      } else if (dist < attackR - holdEps) {
        // too close, hold position (do not back off)
        // Intentionally no movement here
      }
      // Face the player
      const yaw = Math.atan2(dirToPlayer.x, dirToPlayer.z);
      group.current.rotation.y = yaw;
    }
    // Keep grounded
    group.current.position.y = 0;

    // Update ghost bullets
    if (imRef.current) {
      const arr = bulletsRef.current;
      let write = 0;
      const len = arr.length;
      const speedB = BULLET_SPEED;
      const rangeB = attackR; // bullets travel up to attack range
      for (let read = 0; read < len; read++) {
        const b = arr[read];
        const stepB = speedB * delta;
        b.traveled += stepB;
        b.position.addScaledVector(b.direction, stepB);

        let keep = b.traveled <= rangeB;

        // Collision vs player hit radius (XZ plane)
        if (keep) {
          const playerPos = p; // already computed (world)
          const hitR = R;
          const dx = playerPos.x - b.position.x;
          const dz = playerPos.z - b.position.z;
          const dXZ = Math.hypot(dx, dz);
          if (dXZ <= hitR + BULLET_SIZE * 0.5) {
            try { gameGet().damage?.(GHOST_ATTACK); } catch {}
            keep = false;
          }
        }
        if (keep) arr[write++] = b;
      }
      if (write !== len) arr.length = write;

      // render instanced bullets
      const im = imRef.current;
      const count = arr.length;
      im.count = count as unknown as number;
      for (let i = 0; i < count; i++) {
        const b = arr[i];
        tmpObj.position.copy(b.position);
        tmpObj.rotation.set(0, 0, 0);
        tmpObj.scale.setScalar(1);
        tmpObj.updateMatrix();
        im.setMatrixAt(i, tmpObj.matrix);
      }
      im.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      <group ref={group} position={position} name={name}>
        <primitive object={model} />
        {process.env.NODE_ENV !== 'production' && (
          <mesh ref={muzzleHelperRef} frustumCulled={false} renderOrder={1000}>
            <sphereGeometry args={[BULLET_SIZE * 1.1, 8, 8]} />
            <meshBasicMaterial color="#00e5ff" toneMapped={false} depthTest={false} transparent opacity={0.9} />
          </mesh>
        )}
      </group>
      {/* Ghost bullets rendered in world space (sibling of ghost) */}
      <instancedMesh ref={imRef} args={[undefined as any, undefined as any, 128]} frustumCulled={false}>
        <sphereGeometry args={[BULLET_SIZE * 0.9, 10, 10]} />
        <meshBasicMaterial color="#86e0ff" toneMapped={false} />
      </instancedMesh>
    </>
  );
};

useGLTF.preload("/assets/character-ghost.glb");

export default Ghost;
