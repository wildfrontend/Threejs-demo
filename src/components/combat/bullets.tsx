"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useKeyboardControls } from "@react-three/drei";
import {
  BULLET_SPEED,
  BULLET_RANGE,
  FIRE_COOLDOWN,
  MUZZLE_OFFSET,
  MUZZLE_HEIGHT,
  RELOAD_TIME,
} from "@/config/gameplay";
import { useGame } from "@/store/game";

// No input dependency: auto-fire logic only
type Controls = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  shoot: boolean;
};

type Bullet = {
  position: THREE.Vector3;
  direction: THREE.Vector3;
  traveled: number;
};

const MAX_BULLETS = 256;

const Bullets = () => {
  const { scene } = useThree();
  const imRef = useRef<THREE.InstancedMesh>(null!);
  const bulletsRef = useRef<Bullet[]>([]);
  const playerRef = useRef<THREE.Object3D | null>(null);
  const lastShotAt = useRef(0);
  const gameGet = useRef(useGame.getState).current;
  const tmpObj = useMemo(() => new THREE.Object3D(), []);
  const tmpVec = useMemo(() => new THREE.Vector3(), []);
  const reloadTimer = useRef(0);
  const [, get] = useKeyboardControls<Controls>();

  // Locate the player object once available
  useFrame(() => {
    if (!playerRef.current) {
      playerRef.current = scene.getObjectByName("player") || null;
    }
  });

  const spawnBullet = () => {
    if (!playerRef.current) {
      playerRef.current = scene.getObjectByName("player") || null;
      if (!playerRef.current) return;
    }

    // World position and facing
    const p = playerRef.current.getWorldPosition(tmpVec.set(0, 0, 0));
    const q = playerRef.current.getWorldQuaternion(new THREE.Quaternion());
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(q).normalize();

    const start = p
      .clone()
      .add(forward.clone().multiplyScalar(MUZZLE_OFFSET))
      .add(new THREE.Vector3(0, MUZZLE_HEIGHT, 0));

    bulletsRef.current.push({
      position: start,
      direction: forward,
      traveled: 0,
    });
  };

  useFrame((_, delta) => {
    lastShotAt.current += delta;
    const store = gameGet();
    const { shoot } = get();

    // Manual fire: only when shoot key is held and not reloading
    if (shoot && !store.reloading && lastShotAt.current >= FIRE_COOLDOWN) {
      if (store.ammo > 0) {
        spawnBullet();
        lastShotAt.current = 0;
        store.consumeAmmo(1);
      } else {
        // trigger reload if empty
        store.startReload();
        reloadTimer.current = 0;
      }
    }

    // Auto start reload if empty even without pressing
    if (!store.reloading && store.ammo === 0) {
      store.startReload();
      reloadTimer.current = 0;
    }

    // Progress reload timer
    if (store.reloading) {
      reloadTimer.current += delta;
      if (reloadTimer.current >= RELOAD_TIME) {
        store.reloadAmmo();
        store.setReloading(false);
        reloadTimer.current = 0;
      }
    }

    // Update bullets
    const arr = bulletsRef.current;
    let write = 0;
    const len = arr.length;
    for (let read = 0; read < len; read++) {
      const b = arr[read];
      const step = BULLET_SPEED * delta;
      b.traveled += step;
      b.position.addScaledVector(b.direction, step);

      if (b.traveled <= BULLET_RANGE) {
        // keep and write in-place
        arr[write++] = b;
      }
    }
    if (write !== len) arr.length = write; // truncate removed bullets

    // Update instanced matrices
    const im = imRef.current;
    const count = Math.min(arr.length, MAX_BULLETS);
    im.count = count as unknown as number; // narrow for TS
    for (let i = 0; i < count; i++) {
      const b = arr[i];
      tmpObj.position.copy(b.position);
      tmpObj.rotation.set(0, 0, 0);
      tmpObj.scale.setScalar(1);
      tmpObj.updateMatrix();
      im.setMatrixAt(i, tmpObj.matrix);
    }
    im.instanceMatrix.needsUpdate = true;
  });

  // Clean up when unmounting
  useEffect(() => () => void (bulletsRef.current = []), []);

  return (
    <instancedMesh ref={imRef} args={[undefined as any, undefined as any, MAX_BULLETS]} castShadow>
      <sphereGeometry args={[0.08, 8, 8]} />
      <meshStandardMaterial color="#ffd84d" emissive="#ffb300" emissiveIntensity={0.5} />
    </instancedMesh>
  );
};

export default Bullets;
