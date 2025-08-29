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
  VAMPIRE_SPEED,
  VAMPIRE_ATTACK,
  VAMPIRE_HP,
  VAMPIRE_ATTACK_RANGE,
  MONSTER_ATTACK_COOLDOWN,
  VAMPIRE_BULLET_SPEED,
  BULLET_SIZE,
  VAMPIRE_BULLET_DAMAGE,
} from "@/config/gameplay";
import { useGame } from "@/store/game";

type VampireProps = {
  position?: [number, number, number];
  speed?: number; // units per second
  name?: string;
};

const Vampire = ({ position = [-8, 0, -8], speed = VAMPIRE_SPEED, name = "vampire" }: VampireProps) => {
  const group = useRef<THREE.Group>(null!);
  const gltf = useGLTF("/assets/character-vampire.glb");
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

  useEffect(() => {
    if (!model) return;
    model.scale.set(1, 1, 1);
    model.traverse((child: any) => {
      child.castShadow = true;
      child.receiveShadow = true;
    });
    if (group.current) {
      const g: any = group.current;
      g.userData = { ...(g.userData || {}), hp: VAMPIRE_HP, maxHp: VAMPIRE_HP };
    }
  }, [model]);

  // Clear bullets when this vampire unmounts
  useEffect(() => () => void (bulletsRef.current = []), []);

  useFrame((_, delta) => {
    if (gameGet().paused) return;
    // Track player
    if (!playerRef.current) {
      playerRef.current = scene.getObjectByName("player") || null;
    }
    if (!playerRef.current || !group.current) return;

    // If flagged killed/hidden, clear remaining bullets immediately
    const gObj: any = group.current;
    if (gObj?.userData?.killed || gObj?.visible === false) {
      bulletsRef.current.length = 0;
      if (imRef.current) {
        imRef.current.count = 0 as unknown as number;
        imRef.current.instanceMatrix.needsUpdate = true;
      }
      return;
    }
    // Seek player on XZ plane
    const p = playerRef.current.getWorldPosition(tmpP.set(0, 0, 0));
    const g = group.current.position;
    const toPlayer = tmpV.set(p.x - g.x, 0, p.z - g.z);
    const dist = toPlayer.length();

    const R = gameGet().hitRadius || COLLISION_RADIUS;

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

    // Compute vampire model center as the muzzle start (world space)
    let start = g.clone();
    try {
      const box = new THREE.Box3().setFromObject(group.current);
      start = box.getCenter(new THREE.Vector3());
    } catch {}

    // Ranged attack: fire projectile toward player when within attack range (avoid overlapping)
    if (dist > R && dist <= VAMPIRE_ATTACK_RANGE && atkTimer.current <= 0) {
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
        gameGet().damage?.(VAMPIRE_ATTACK);
      } catch {}
      atkTimer.current = Math.max(atkTimer.current, MONSTER_ATTACK_COOLDOWN);
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
        // Deal contact damage to player and throttle ranged cooldown
        try {
          gameGet().damage?.(VAMPIRE_ATTACK);
        } catch {}
        atkTimer.current = Math.max(atkTimer.current, MONSTER_ATTACK_COOLDOWN);
      } else {
        g.copy(candidate);
      }

      // face towards player only when not retreating
      const yaw = Math.atan2(dir.x, dir.z);
      group.current.rotation.y = yaw;
    }
    // Keep grounded
    group.current.position.y = 0;

    // Update vampire bullets (world space)
    if (imRef.current) {
      const arr = bulletsRef.current;
      let write = 0;
      const len = arr.length;
      const speedB = VAMPIRE_BULLET_SPEED;
      const rangeB = VAMPIRE_ATTACK_RANGE;
      for (let read = 0; read < len; read++) {
        const b = arr[read];
        const stepB = speedB * delta;
        b.traveled += stepB;
        b.position.addScaledVector(b.direction, stepB);

        let keep = b.traveled <= rangeB;

        // Collision vs player hit radius (XZ plane)
        if (keep) {
          const playerPos = p; // world position
          const hitR = R;
          const dx = playerPos.x - b.position.x;
          const dz = playerPos.z - b.position.z;
          const dXZ = Math.hypot(dx, dz);
          if (dXZ <= hitR + BULLET_SIZE * 0.5) {
            try { gameGet().damage?.(VAMPIRE_BULLET_DAMAGE); } catch {}
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
      </group>
      <instancedMesh ref={imRef} args={[undefined as any, undefined as any, 128]} frustumCulled={false}>
        <sphereGeometry args={[BULLET_SIZE * 1.0, 12, 12]} />
        <meshBasicMaterial color="#ff4d4d" toneMapped={false} />
      </instancedMesh>
    </>
  );
};

useGLTF.preload("/assets/character-vampire.glb");

export default Vampire;
